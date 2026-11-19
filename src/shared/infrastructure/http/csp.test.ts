import { describe, expect, it, vi } from "vitest";
import {
  API_POLICY,
  CSP_REPORT_PATH,
  contentSecurityPolicy,
  createCspReportHandler,
  createNonce,
  policyForPath,
  summarizeCspReports,
} from "./csp";

const NONCE = "AAAAAAAAAAAAAAAAAAAAAA==";

describe("contentSecurityPolicy", () => {
  it("allows only this site and the request's nonce in production", () => {
    expect(contentSecurityPolicy({ nonce: NONCE, dev: false })).toBe(
      [
        "default-src 'self'",
        `script-src 'self' 'nonce-${NONCE}' 'strict-dynamic'`,
        `style-src 'self' 'nonce-${NONCE}'`,
        "img-src 'self' data:",
        "font-src 'self'",
        "connect-src 'self'",
        "object-src 'none'",
        "base-uri 'none'",
        "form-action 'self'",
        "frame-ancestors 'none'",
        "report-uri /api/csp-report",
        "report-to csp",
      ].join("; "),
    );
  });

  it("adds 'unsafe-eval' and inline styles in development only (dev server needs)", () => {
    const dev = contentSecurityPolicy({ nonce: NONCE, dev: true });
    expect(dev).toContain(
      `script-src 'self' 'nonce-${NONCE}' 'strict-dynamic' 'unsafe-eval';`,
    );
    expect(dev).toContain("style-src 'self' 'unsafe-inline';");
    const production = contentSecurityPolicy({ nonce: NONCE, dev: false });
    expect(production).not.toContain("unsafe-eval");
    expect(production).not.toContain("unsafe-inline");
  });
});

describe("contentSecurityPolicy with audience measurement", () => {
  const host = "https://stats.example.test";

  it("adds the analytics origin to script-src and connect-src, nothing else", () => {
    const policy = contentSecurityPolicy({ nonce: NONCE, dev: false, analytics: host });
    expect(policy).toBe(
      contentSecurityPolicy({ nonce: NONCE, dev: false })
        .replace("'strict-dynamic'", `'strict-dynamic' ${host}`)
        .replace("connect-src 'self'", `connect-src 'self' ${host}`),
    );
    expect(contentSecurityPolicy({ nonce: NONCE, dev: false, analytics: null })).toBe(
      contentSecurityPolicy({ nonce: NONCE, dev: false }),
    );
  });

  it("never gives it to the API sandbox", () => {
    expect(policyForPath("/api/health", { nonce: NONCE, dev: false, analytics: host })).toBe(
      API_POLICY,
    );
    expect(policyForPath("/faq", { nonce: NONCE, dev: false, analytics: host })).toContain(
      `connect-src 'self' ${host}`,
    );
  });
});

describe("policyForPath", () => {
  it("gives pages the nonce policy and the API a sandbox that loads nothing", () => {
    expect(policyForPath("/", { nonce: NONCE, dev: false })).toBe(
      contentSecurityPolicy({ nonce: NONCE, dev: false }),
    );
    expect(policyForPath("/eau-robinet/paris", { nonce: NONCE, dev: false })).toContain(
      `'nonce-${NONCE}'`,
    );
    expect(policyForPath("/apiculture", { nonce: NONCE, dev: false })).toContain(
      `'nonce-${NONCE}'`,
    );
    for (const path of ["/api", "/api/health", "/api/udi/075000123/quality"]) {
      expect(policyForPath(path, { nonce: NONCE, dev: false })).toBe(API_POLICY);
    }
    expect(API_POLICY).toBe("default-src 'none'; frame-ancestors 'none'; sandbox");
  });
});

describe("createNonce", () => {
  it("returns 128 random bits in base64, different on every call", () => {
    const nonces = new Set(Array.from({ length: 50 }, () => createNonce()));
    expect(nonces.size).toBe(50);
    for (const nonce of nonces) {
      expect(nonce).toMatch(/^[A-Za-z0-9+/]{22}==$/);
      expect(Buffer.from(nonce, "base64")).toHaveLength(16);
    }
  });
});

describe("summarizeCspReports", () => {
  it("reads the report-uri format and keeps only directive, origin and path", () => {
    expect(
      summarizeCspReports(
        JSON.stringify({
          "csp-report": {
            "document-uri": "https://fontus.fr/eau-robinet/paris?adresse=10+rue+x#top",
            "violated-directive": "script-src-elem",
            "blocked-uri": "https://evil.example/x.js?token=1",
          },
        }),
      ),
    ).toEqual([
      {
        directive: "script-src-elem",
        blocked: "https://evil.example",
        page: "/eau-robinet/paris",
      },
    ]);
  });

  it("reads the Reporting API format, skipping other report types", () => {
    expect(
      summarizeCspReports(
        JSON.stringify([
          { type: "deprecation", body: { message: "x" } },
          null,
          {
            type: "csp-violation",
            body: {
              documentURL: "https://fontus.fr/faq",
              effectiveDirective: "script-src-elem",
              blockedURL: "inline",
            },
          },
          { type: "csp-violation", body: null },
        ]),
      ),
    ).toEqual([{ directive: "script-src-elem", blocked: "inline", page: "/faq" }]);
  });

  it("keeps keywords and non-http schemes as the browser names them", () => {
    expect(
      summarizeCspReports(
        JSON.stringify({
          "csp-report": {
            "document-uri": "/glossaire?x=1",
            "effective-directive": "img-src",
            "blocked-uri": "blob:https://fontus.fr/abc",
          },
        }),
      ),
    ).toEqual([{ directive: "img-src", blocked: "blob", page: "/glossaire" }]);
  });

  it("caps field lengths and the number of reports per body", () => {
    const body = {
      documentURL: `https://fontus.fr/${"a".repeat(500)}`,
      effectiveDirective: "x".repeat(500),
      blockedURL: 42,
    };
    const result = summarizeCspReports(
      JSON.stringify(Array.from({ length: 30 }, () => ({ type: "csp-violation", body }))),
    );
    expect(result).toHaveLength(10);
    expect(result[0]?.directive).toHaveLength(200);
    expect(result[0]?.blocked).toBe("");
    expect(result[0]?.page.length).toBeLessThanOrEqual(200);
  });

  it("ignores bodies that are not reports", () => {
    expect(summarizeCspReports("not json")).toEqual([]);
    expect(summarizeCspReports("42")).toEqual([]);
    expect(summarizeCspReports(JSON.stringify({ "csp-report": null }))).toEqual([]);
    expect(summarizeCspReports(JSON.stringify({ other: 1 }))).toEqual([]);
  });
});

function reportRequest(body: BodyInit | null, headers: Record<string, string> = {}) {
  return new Request(`http://localhost${CSP_REPORT_PATH}`, {
    method: "POST",
    body,
    headers: { "content-type": "application/csp-report", ...headers },
    ...(body instanceof ReadableStream ? { duplex: "half" } : {}),
  } as RequestInit);
}

const violation = JSON.stringify({
  "csp-report": {
    "document-uri": "https://fontus.fr/",
    "violated-directive": "script-src-elem",
    "blocked-uri": "inline",
  },
});

describe("createCspReportHandler", () => {
  it("logs one csp violation warning per report (Manon's line shape) and answers 204", async () => {
    const report = vi.fn();
    const handle = createCspReportHandler({ observability: { report } });
    const response = await handle(reportRequest(violation));
    expect(response.status).toBe(204);
    expect(report).toHaveBeenCalledTimes(1);
    expect(report).toHaveBeenCalledWith({
      level: "warn",
      scope: "csp",
      event: "violation",
      msg: "csp violation",
      fields: { directive: "script-src-elem", blocked: "inline", page: "/" },
    });
  });

  it("answers 204 without logging for an empty or unreadable body", async () => {
    const report = vi.fn();
    const handle = createCspReportHandler({ observability: { report } });
    expect((await handle(reportRequest(null))).status).toBe(204);
    expect((await handle(reportRequest("{"))).status).toBe(204);
    expect(report).not.toHaveBeenCalled();
  });

  it("refuses a body over 16 KiB, declared or streamed, without logging", async () => {
    const report = vi.fn();
    const handle = createCspReportHandler({ observability: { report } });
    const declared = await handle(
      reportRequest(violation, { "content-length": String(17 * 1024) }),
    );
    expect(declared.status).toBe(413);
    const chunk = new TextEncoder().encode("x".repeat(4096));
    let sent = 0;
    const stream = new ReadableStream<Uint8Array>({
      pull(controller) {
        sent += 1;
        if (sent > 10) {
          controller.close();
          return;
        }
        controller.enqueue(chunk);
      },
    });
    expect((await handle(reportRequest(stream))).status).toBe(413);
    expect(sent).toBeLessThan(10);
    expect(report).not.toHaveBeenCalled();
  });

  it("logs at most perMinute reports per minute, then starts again", async () => {
    const report = vi.fn();
    let time = 1_000_000;
    const handle = createCspReportHandler({
      observability: { report },
      now: () => time,
      perMinute: 2,
    });
    for (let index = 0; index < 4; index += 1) {
      expect((await handle(reportRequest(violation))).status).toBe(204);
    }
    expect(report).toHaveBeenCalledTimes(2);
    time += 60_000;
    await handle(reportRequest(violation));
    expect(report).toHaveBeenCalledTimes(3);
  });
});
