import { describe, expect, it, vi } from "vitest";
import { ApplicationError } from "@/application/errors/ApplicationError";

const consumeRateLimit = vi.fn();

vi.mock("@/composition/bootstrap", () => ({
  ensureApplication: () => ({ consumeRateLimit }),
}));

describe("enforceRateLimit", () => {
  it("allows a request under the quota and throws when exhausted", async () => {
    const { enforceRateLimit, clientIpFrom } = await import("./enforceRateLimit");
    consumeRateLimit.mockResolvedValueOnce(true);
    await enforceRateLimit(
      new Request("http://localhost/api", {
        headers: { "x-forwarded-for": "1.2.3.4, 10.0.0.1" },
      }),
      "quality",
    );
    expect(consumeRateLimit).toHaveBeenCalledWith({
      key: "quality:1.2.3.4",
      limit: 20,
      windowMs: 60_000,
    });

    consumeRateLimit.mockResolvedValueOnce(false);
    await expect(
      enforceRateLimit(new Request("http://localhost/api"), "errors"),
    ).rejects.toBeInstanceOf(ApplicationError);
    expect(clientIpFrom(new Request("http://localhost/api"))).toBe("unknown");
  });
});
