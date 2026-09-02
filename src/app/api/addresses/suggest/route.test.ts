import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApplicationError } from "@/application/errors/ApplicationError";

const execute = vi.fn();
const reportError = vi.fn();

vi.mock("@/composition/bootstrap", () => ({
  ensureApplication: () => ({
    suggestAddressesUseCase: { execute },
    reportError,
  }),
}));

describe("GET /api/addresses/suggest", () => {
  beforeEach(() => {
    execute.mockReset();
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

  it("rethrows unexpected errors", async () => {
    execute.mockRejectedValueOnce(new Error("boom"));
    const { GET } = await import("./route");
    await expect(
      GET(new Request("http://localhost/api/addresses/suggest?q=x")),
    ).rejects.toThrow("boom");
  });
});
