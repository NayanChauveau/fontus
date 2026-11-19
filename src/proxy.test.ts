import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { config, proxy } from "./proxy";

function forwardedHeader(response: Response, name: string): string | null {
  // NextResponse.next({ request: { headers } }) passes the request headers on to the render
  // as `x-middleware-request-<name>`.
  return response.headers.get(`x-middleware-request-${name}`);
}

describe("proxy", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("sends a page a nonce policy and passes the same nonce to the render", () => {
    vi.stubEnv("NODE_ENV", "production");
    const response = proxy(
      new NextRequest("https://fontus.fr/eau-robinet/paris", {
        headers: { "x-nonce": "attacker-chosen" },
      }),
    );
    const policy = response.headers.get("content-security-policy") ?? "";
    const nonce = /'nonce-([^']+)'/.exec(policy)?.[1];
    expect(nonce).toMatch(/^[A-Za-z0-9+/]{22}==$/);
    expect(policy).toContain("'strict-dynamic'");
    expect(policy).toContain("frame-ancestors 'none'");
    expect(policy).toContain("report-uri /api/csp-report");
    expect(policy).not.toContain("unsafe-eval");
    expect(forwardedHeader(response, "x-nonce")).toBe(nonce);
    expect(forwardedHeader(response, "content-security-policy")).toBe(policy);
    expect(response.headers.get("reporting-endpoints")).toBe('csp="/api/csp-report"');
  });

  it("uses a fresh nonce on every request", () => {
    const nonces = new Set(
      Array.from({ length: 20 }, () =>
        proxy(new NextRequest("https://fontus.fr/")).headers.get("content-security-policy"),
      ),
    );
    expect(nonces.size).toBe(20);
  });

  it("allows eval in development only", () => {
    vi.stubEnv("NODE_ENV", "development");
    const policy = proxy(new NextRequest("https://fontus.fr/")).headers.get(
      "content-security-policy",
    );
    expect(policy).toContain("'unsafe-eval'");
  });

  it("sends the API a sandbox policy without nonce or report endpoint", () => {
    const response = proxy(new NextRequest("https://fontus.fr/api/health"));
    expect(response.headers.get("content-security-policy")).toBe(
      "default-src 'none'; frame-ancestors 'none'; sandbox",
    );
    expect(response.headers.get("reporting-endpoints")).toBeNull();
    expect(forwardedHeader(response, "x-nonce")).toBeNull();
  });

  it("runs on every path except Next's hashed static files and image optimiser", () => {
    expect(config.matcher).toEqual(["/((?!_next/static|_next/image).*)"]);
  });
});
