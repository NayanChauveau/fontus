/**
 * Content Security Policy of the site, set by src/proxy.ts with a fresh nonce per request (ported
 * from manon-karsenti's src/core/http/csp.ts, same mechanism on every site). Next.js reads the
 * nonce from the request's policy and puts it on its own scripts; the root layout gives it to the
 * theme and language bootstrap script. Anything else (an injected <script>, an inline handler, a
 * script from another site) is refused, and the browser reports it to CSP_REPORT_PATH.
 *
 * The browser only talks to this site: 'strict-dynamic' trusts only what the nonced scripts load,
 * and connect-src stays 'self' (Hub'Eau and the address API are called by the server). The one
 * exception is the audience measurement, when configured (src/presentation/analytics): its origin
 * is added to script-src (for browsers without 'strict-dynamic'; the tag carries the nonce) and
 * to connect-src (the tracker posts the visits).
 * JSON-LD blocks are data, never run, so they need no nonce.
 */
export const CSP_REPORT_PATH = "/api/csp-report";

/** Route handlers return JSON only: nothing may load or run if one is opened as a document. */
export const API_POLICY = "default-src 'none'; frame-ancestors 'none'; sandbox";

type PolicyOptions = {
  nonce: string;
  dev: boolean;
  /** Origin of the audience measurement, if any. */
  analytics?: string | null;
};

export function contentSecurityPolicy({ nonce, dev, analytics = null }: PolicyOptions): string {
  const measurement = analytics ? [analytics] : [];
  // React rebuilds server error stacks with eval in development only.
  const evalInDev = dev ? ["'unsafe-eval'"] : [];
  // Production pages need no inline style (tests/e2e/csp.spec.ts): stylesheets are files and
  // Next.js nonces the <style> tags it writes. A server-rendered style="" attribute would be
  // blocked and reported. The dev server injects styles without the nonce.
  const inlineStyles = dev ? "'unsafe-inline'" : `'nonce-${nonce}'`;
  return [
    "default-src 'self'",
    `script-src ${["'self'", `'nonce-${nonce}'`, "'strict-dynamic'", ...measurement, ...evalInDev].join(" ")}`,
    `style-src 'self' ${inlineStyles}`,
    "img-src 'self' data:",
    "font-src 'self'",
    `connect-src ${["'self'", ...measurement].join(" ")}`,
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    `report-uri ${CSP_REPORT_PATH}`,
    "report-to csp",
  ].join("; ");
}

export function policyForPath(pathname: string, options: PolicyOptions): string {
  return pathname === "/api" || pathname.startsWith("/api/")
    ? API_POLICY
    : contentSecurityPolicy(options);
}

/** 128 random bits, base64. */
export function createNonce(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return btoa(String.fromCharCode(...bytes));
}

export type CspViolation = {
  directive: string;
  /** Origin of the blocked resource, or the browser's keyword ("inline", "eval", "data"…). */
  blocked: string;
  /** Path of the page, without query or fragment (addresses travel in the query string). */
  page: string;
};

const MAX_PER_BODY = 10;
const MAX_FIELD = 200;
const field = (value: unknown) =>
  typeof value === "string" ? value.slice(0, MAX_FIELD) : "";

function origin(value: string): string {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.origin
      : url.protocol.replace(":", "");
  } catch {
    return value;
  }
}

function pagePath(value: string): string {
  try {
    return new URL(value).pathname;
  } catch {
    return value.replace(/[?#][\s\S]*$/, "");
  }
}

/** Both report formats: report-uri ({"csp-report": {...}}) and the Reporting API ([{type, body}]). */
export function summarizeCspReports(text: string): CspViolation[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return [];
  }
  const bodies: Record<string, unknown>[] = [];
  if (Array.isArray(parsed)) {
    for (const entry of parsed as unknown[]) {
      if (!entry || typeof entry !== "object") {
        continue;
      }
      const { type, body } = entry as { type?: unknown; body?: unknown };
      if (type === "csp-violation" && body && typeof body === "object") {
        bodies.push(body as Record<string, unknown>);
      }
    }
  } else if (parsed && typeof parsed === "object" && "csp-report" in parsed) {
    const report = (parsed as Record<string, unknown>)["csp-report"];
    if (report && typeof report === "object") {
      bodies.push(report as Record<string, unknown>);
    }
  }
  return bodies.slice(0, MAX_PER_BODY).map((body) => ({
    directive: field(
      body.effectiveDirective ??
        body["effective-directive"] ??
        body["violated-directive"],
    ),
    blocked: origin(field(body.blockedURL ?? body["blocked-uri"])),
    page: pagePath(field(body.documentURL ?? body["document-uri"])).slice(0, MAX_FIELD),
  }));
}

const MAX_BODY_BYTES = 16 * 1024;

/** The body as text, or null past `limit` bytes: read as a stream, so a chunked body without a
 * Content-Length is never buffered beyond the limit. */
async function readCapped(request: Request, limit: number): Promise<string | null> {
  if (!request.body) {
    return "";
  }
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    size += value.byteLength;
    if (size > limit) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  return new TextDecoder().decode(Buffer.concat(chunks));
}

type CspViolationEvent = {
  level: "warn";
  scope: "csp";
  event: "violation";
  msg: "csp violation";
  fields: CspViolation;
};

/**
 * POST handler of CSP_REPORT_PATH: one "csp violation" warning per report, with top-level
 * directive, blocked and page like manon-karsenti's (one Grafana panel reads both sites); at
 * most `perMinute` per minute (per server process) so that nobody can flood the logs; bodies
 * over 16 KiB are refused (413); always 204 otherwise.
 */
export function createCspReportHandler({
  observability,
  now = Date.now,
  perMinute = 60,
}: {
  observability: { report(event: CspViolationEvent): void };
  now?: () => number;
  perMinute?: number;
}) {
  let windowStart = 0;
  let logged = 0;
  return async function handle(request: Request): Promise<Response> {
    if (Number(request.headers.get("content-length") ?? 0) > MAX_BODY_BYTES) {
      return new Response(null, { status: 413 });
    }
    const text = await readCapped(request, MAX_BODY_BYTES);
    if (text === null) {
      return new Response(null, { status: 413 });
    }
    const time = now();
    if (time - windowStart >= 60_000) {
      windowStart = time;
      logged = 0;
    }
    for (const violation of summarizeCspReports(text)) {
      if (logged >= perMinute) {
        break;
      }
      logged += 1;
      observability.report({
        level: "warn",
        scope: "csp",
        event: "violation",
        msg: "csp violation",
        fields: { ...violation },
      });
    }
    return new Response(null, { status: 204 });
  };
}
