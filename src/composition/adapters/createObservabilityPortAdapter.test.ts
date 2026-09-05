import { describe, expect, it, vi, beforeEach } from "vitest";

const init = vi.fn();
const captureException = vi.fn();
const captureMessage = vi.fn();

vi.mock("@sentry/node", () => ({
  init,
  captureException,
  captureMessage,
}));

describe("createObservabilityPortAdapter", () => {
  beforeEach(() => {
    init.mockReset();
    captureException.mockReset();
    captureMessage.mockReset();
    delete process.env.SENTRY_DSN;
  });

  it("writes a structured error to stderr", async () => {
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});
    const { createObservabilityPortAdapter } = await import(
      "./createObservabilityPortAdapter"
    );
    createObservabilityPortAdapter().report({
      level: "error",
      scope: "analyses",
      event: "quality_unavailable",
      code: "ANALYSES_UNAVAILABLE",
    });
    expect(logged).toHaveBeenCalled();
    expect(init).not.toHaveBeenCalled();
    logged.mockRestore();
  });

  it("forwards errors to Sentry when a DSN is set", async () => {
    process.env.SENTRY_DSN = "https://key@example.test/1";
    vi.resetModules();
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});
    const { createObservabilityPortAdapter } = await import(
      "./createObservabilityPortAdapter"
    );
    const cause = new Error("timeout");
    createObservabilityPortAdapter().report({
      level: "error",
      scope: "analyses",
      event: "quality_unavailable",
      code: "ANALYSES_UNAVAILABLE",
      cause,
    });
    expect(init).toHaveBeenCalledWith(
      expect.objectContaining({ dsn: "https://key@example.test/1" }),
    );
    expect(captureException).toHaveBeenCalledWith(
      cause,
      expect.objectContaining({
        tags: expect.objectContaining({ scope: "analyses" }),
      }),
    );
    createObservabilityPortAdapter().report({
      level: "error",
      scope: "ui",
      event: "client_error",
      cause: "boom",
    });
    expect(init).toHaveBeenCalledOnce();
    expect(captureMessage).toHaveBeenCalledWith(
      "client_error",
      expect.objectContaining({ level: "error" }),
    );
    logged.mockRestore();
  });
});
