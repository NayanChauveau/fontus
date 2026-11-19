import { NextResponse, type NextRequest } from "next/server";
import { ANALYTICS, activeAnalytics } from "@/presentation/analytics/analytics";
import { NONCE_HEADER } from "@/presentation/security/requestNonce";
import {
  CSP_REPORT_PATH,
  createNonce,
  policyForPath,
} from "@/shared/infrastructure/http/csp";

/**
 * Next.js proxy (formerly middleware): every page gets a Content Security Policy with a fresh
 * nonce (src/shared/infrastructure/http/csp.ts); route handlers get a sandbox that loads nothing.
 * The static headers (HSTS, nosniff, referrer, permissions) stay in next.config.ts.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const nonce = createNonce();
  const policy = policyForPath(pathname, {
    nonce,
    dev: process.env.NODE_ENV === "development",
    analytics: activeAnalytics(ANALYTICS, process.env.NODE_ENV)?.host ?? null,
  });
  const headers = new Headers(request.headers);
  // Always overwritten: a client-sent x-nonce never reaches the render.
  headers.delete(NONCE_HEADER);
  if (policy.includes(`'nonce-${nonce}'`)) {
    headers.set(NONCE_HEADER, nonce);
  }
  // Next.js takes the nonce from this request header and adds it to its own scripts.
  headers.set("Content-Security-Policy", policy);
  const response = NextResponse.next({ request: { headers } });
  response.headers.set("Content-Security-Policy", policy);
  if (headers.has(NONCE_HEADER)) {
    response.headers.set("Reporting-Endpoints", `csp="${CSP_REPORT_PATH}"`);
  }
  return response;
}

// Next.js reads `config.matcher` statically: it stays a literal.
export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
