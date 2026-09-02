import { beforeEach, describe, expect, it, vi } from "vitest";

const execute = vi.fn();

vi.mock("@/shared/infrastructure/db/client", () => ({
  getDb: () => ({ execute }),
}));

describe("createHealthPortAdapter", () => {
  beforeEach(() => {
    execute.mockReset();
  });

  it("pings postgres", async () => {
    execute.mockResolvedValueOnce([{ "?column?": 1 }]);
    const { createHealthPortAdapter } = await import("./createHealthPortAdapter");
    const ping = await createHealthPortAdapter().ping();
    expect(ping.ok).toBe(true);
    expect(ping.at).toBeInstanceOf(Date);
  });
});
