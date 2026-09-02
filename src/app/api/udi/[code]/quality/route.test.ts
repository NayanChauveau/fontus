import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApplicationError } from "@/application/errors/ApplicationError";

const execute = vi.fn();

vi.mock("@/composition/bootstrap", () => ({
  ensureApplication: () => ({
    getNetworkWaterQualityUseCase: { execute },
  }),
}));

describe("GET /api/udi/:code/quality", () => {
  beforeEach(() => {
    execute.mockReset();
  });

  it("rejects an invalid network code", async () => {
    const { GET } = await import("./route");
    const response = await GET(new Request("http://localhost/api/udi/bad/quality"), {
      params: Promise.resolve({ code: "bad" }),
    });
    expect(response.status).toBe(400);

    const missing = await GET(
      new Request("http://localhost/api/udi/undefined/quality"),
      { params: Promise.resolve({ code: undefined as unknown as string }) },
    );
    expect(missing.status).toBe(400);
  });

  it("returns quality", async () => {
    execute.mockResolvedValueOnce({ latestMeasurements: [] });
    const { GET } = await import("./route");
    const response = await GET(
      new Request("http://localhost/api/udi/033001214/quality"),
      { params: Promise.resolve({ code: "033001214" }) },
    );
    expect(response.status).toBe(200);
  });

  it("maps application errors to 503", async () => {
    execute.mockRejectedValueOnce(new ApplicationError("ANALYSES_UNAVAILABLE"));
    const { GET } = await import("./route");
    const response = await GET(
      new Request("http://localhost/api/udi/033001214/quality"),
      { params: Promise.resolve({ code: "033001214" }) },
    );
    expect(response.status).toBe(503);
  });

  it("rethrows unexpected errors", async () => {
    execute.mockRejectedValueOnce(new Error("boom"));
    const { GET } = await import("./route");
    await expect(
      GET(new Request("http://localhost/api/udi/033001214/quality"), {
        params: Promise.resolve({ code: "033001214" }),
      }),
    ).rejects.toThrow("boom");
  });
});
