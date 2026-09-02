import { describe, expect, it, vi } from "vitest";

const createApp = vi.fn(() => ({ application: { ok: true } }));

vi.mock("./createApp", () => ({
  createApp: () => createApp(),
}));

vi.mock("@/application/getApplication", () => ({
  getApplication: () => ({ ok: true }),
}));

describe("ensureApplication", () => {
  it("creates the app once", async () => {
    const { ensureApplication, resetBootstrap } = await import("./bootstrap");
    resetBootstrap();
    createApp.mockClear();
    expect(ensureApplication()).toEqual({ ok: true });
    expect(ensureApplication()).toEqual({ ok: true });
    expect(createApp).toHaveBeenCalledTimes(1);
    resetBootstrap();
  });
});
