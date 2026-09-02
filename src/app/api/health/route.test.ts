import { describe, expect, it, vi } from "vitest";

vi.mock("@/composition/bootstrap", () => ({
  ensureApplication: () => ({
    healthCheckUseCase: {
      async execute() {
        return { status: "ok", postgres: true, checkedAt: "t" };
      },
    },
  }),
}));

describe("GET /api/health", () => {
  it("returns 200 when the stack is ok", async () => {
    const { GET } = await import("./route");
    const response = await GET();
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ status: "ok" });
  });
});
