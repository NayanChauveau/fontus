import { beforeEach, describe, expect, it, vi } from "vitest";

const reportError = vi.fn();
const consumeRateLimit = vi.fn(async () => true);

vi.mock("@/composition/bootstrap", () => ({
  ensureApplication: () => ({ reportError, consumeRateLimit }),
}));

describe("POST /api/sentry-check", () => {
  beforeEach(() => {
    reportError.mockReset();
    consumeRateLimit.mockReset();
    consumeRateLimit.mockResolvedValue(true);
    delete process.env.SENTRY_DSN;
  });

  it("reports a check event and says when Sentry is not configured", async () => {
    const { POST } = await import("./route");
    const response = await POST(new Request("http://localhost/api/sentry-check"));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, configured: false });
    expect(reportError).toHaveBeenCalledWith({
      scope: "observability",
      event: "sentry_check",
      cause: "Sentry configuration check",
    });
  });

  it("says when the DSN is present", async () => {
    process.env.SENTRY_DSN = "https://key@example.test/1";
    const { POST } = await import("./route");
    const response = await POST(new Request("http://localhost/api/sentry-check"));
    expect(await response.json()).toEqual({ ok: true, configured: true });
  });

  it("maps a rate-limit failure", async () => {
    consumeRateLimit.mockResolvedValueOnce(false);
    const { POST } = await import("./route");
    const response = await POST(new Request("http://localhost/api/sentry-check"));
    expect(response.status).toBe(429);
    expect(reportError).toHaveBeenCalledWith(
      expect.objectContaining({ event: "sentry_check_rate_limited" }),
    );
  });
});
