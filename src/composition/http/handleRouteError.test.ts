import { describe, expect, it, vi } from "vitest";
import { ApplicationError } from "@/application/errors/ApplicationError";

const reportError = vi.fn();

vi.mock("@/composition/bootstrap", () => ({
  ensureApplication: () => ({ reportError }),
}));

describe("handleRouteError", () => {
  it("reports an ApplicationError and returns 503", async () => {
    reportError.mockReset();
    const { handleRouteError } = await import("./handleRouteError");
    const response = handleRouteError(
      new ApplicationError("ANALYSES_UNAVAILABLE", new Error("timeout")),
      { scope: "analyses", event: "quality_unavailable", context: { networkCode: "013000577" } },
    );

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "ANALYSES_UNAVAILABLE" });
    expect(reportError).toHaveBeenCalledWith({
      scope: "analyses",
      event: "quality_unavailable",
      code: "ANALYSES_UNAVAILABLE",
      cause: expect.any(Error),
      context: { networkCode: "013000577" },
    });
  });

  it("maps rate limits and unexpected application errors", async () => {
    const { handleRouteError } = await import("./handleRouteError");
    const limited = handleRouteError(new ApplicationError("RATE_LIMITED"), {
      scope: "analyses",
      event: "quality_rate_limited",
    });
    expect(limited.status).toBe(429);
    const unexpectedApp = handleRouteError(new ApplicationError("UNEXPECTED"), {
      scope: "analyses",
      event: "quality_unexpected",
    });
    expect(unexpectedApp.status).toBe(500);
  });

  it("reports then returns 500 for an unexpected error", async () => {
    const { handleRouteError } = await import("./handleRouteError");
    const boom = new Error("boom postgres://secret.example/db");
    const response = handleRouteError(boom, {
      scope: "network",
      event: "networks_unavailable",
    });
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "UNEXPECTED" });
    expect(reportError).toHaveBeenCalledWith({
      scope: "network",
      event: "networks_unavailable_unexpected",
      cause: expect.objectContaining({
        message: expect.stringContaining("[redacted]"),
      }),
      context: undefined,
    });
  });

  it("keeps a non-Error cause as-is", async () => {
    const { handleRouteError } = await import("./handleRouteError");
    const response = handleRouteError("down", {
      scope: "network",
      event: "networks_unavailable",
    });
    expect(response.status).toBe(500);
    expect(reportError).toHaveBeenCalledWith(
      expect.objectContaining({ cause: "down" }),
    );
  });
});
