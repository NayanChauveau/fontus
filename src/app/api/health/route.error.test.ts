import { describe, expect, it, vi } from "vitest";

vi.mock("@/composition/bootstrap", () => ({
  ensureApplication: () => ({
    healthCheckUseCase: {
      async execute() {
        return { status: "error", postgres: false, checkedAt: "t" };
      },
    },
  }),
}));

describe("GET /api/health error", () => {
  it("returns 503 when postgres is down", async () => {
    const { GET } = await import("./route");
    const response = await GET();
    expect(response.status).toBe(503);
  });
});
