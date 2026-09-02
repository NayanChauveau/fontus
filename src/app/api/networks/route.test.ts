import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApplicationError } from "@/application/errors/ApplicationError";

const execute = vi.fn();

vi.mock("@/composition/bootstrap", () => ({
  ensureApplication: () => ({
    listDistributionNetworksUseCase: { execute },
  }),
}));

describe("GET /api/networks", () => {
  beforeEach(() => {
    execute.mockReset();
  });

  it("rejects an invalid citycode", async () => {
    const { GET } = await import("./route");
    const response = await GET(new Request("http://localhost/api/networks"));
    expect(response.status).toBe(400);
    expect(execute).not.toHaveBeenCalled();
  });

  it("returns networks", async () => {
    execute.mockResolvedValueOnce({ confidence: "exact", networks: [] });
    const { GET } = await import("./route");
    const response = await GET(
      new Request("http://localhost/api/networks?citycode=33063"),
    );
    expect(response.status).toBe(200);
  });

  it("maps application errors to 503", async () => {
    execute.mockRejectedValueOnce(new ApplicationError("NETWORKS_UNAVAILABLE"));
    const { GET } = await import("./route");
    const response = await GET(
      new Request("http://localhost/api/networks?citycode=33063"),
    );
    expect(response.status).toBe(503);
  });

  it("rethrows unexpected errors", async () => {
    execute.mockRejectedValueOnce(new Error("boom"));
    const { GET } = await import("./route");
    await expect(
      GET(new Request("http://localhost/api/networks?citycode=33063")),
    ).rejects.toThrow("boom");
  });
});
