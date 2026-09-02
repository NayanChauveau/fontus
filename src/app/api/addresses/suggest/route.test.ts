import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApplicationError } from "@/application/errors/ApplicationError";

const execute = vi.fn();
const reportError = vi.fn();
const consumeRateLimit = vi.fn(async () => true);

vi.mock("@/composition/bootstrap", () => ({
  ensureApplication: () => ({
    suggestAddressesUseCase: { execute },
    reportError,
    consumeRateLimit,
  }),
}));

describe("GET /api/addresses/suggest", () => {
  beforeEach(() => {
    execute.mockReset();
    consumeRateLimit.mockReset();
    consumeRateLimit.mockResolvedValue(true);
  });

  it("returns suggestions", async () => {
    execute.mockResolvedValueOnce({ suggestions: [] });
    const { GET } = await import("./route");
    const response = await GET(
      new Request("http://localhost/api/addresses/suggest?q=bor"),
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ suggestions: [] });
  });

  it("maps application errors to 503", async () => {
    execute.mockRejectedValueOnce(new ApplicationError("GEOCODING_UNAVAILABLE"));
    const { GET } = await import("./route");
    const response = await GET(
      new Request("http://localhost/api/addresses/suggest"),
    );
    expect(response.status).toBe(503);
  });

  it("returns 500 for unexpected errors", async () => {
    execute.mockRejectedValueOnce(new Error("boom"));
    const { GET } = await import("./route");
    const response = await GET(
      new Request("http://localhost/api/addresses/suggest?q=x"),
    );
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "UNEXPECTED" });
  });
});
