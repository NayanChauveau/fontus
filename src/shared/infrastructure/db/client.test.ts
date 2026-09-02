import { describe, expect, it, vi } from "vitest";

const { postgres } = vi.hoisted(() => ({
  postgres: vi.fn(() => ({ mocked: true })),
}));

vi.mock("postgres", () => ({
  default: postgres,
}));

vi.mock("drizzle-orm/postgres-js", () => ({
  drizzle: () => ({ tagged: "db" }),
}));

vi.mock("./env", () => ({
  getDatabaseUrl: () => "postgres://db.example/app",
  getDatabasePoolMax: () => 5,
  shouldRequireDatabaseSsl: () => true,
}));

describe("getDb", () => {
  it("returns a singleton and opens the pool with ssl", async () => {
    const { getDb, getSql } = await import("./client");
    expect(getDb()).toBe(getDb());
    expect(getDb()).toEqual({ tagged: "db" });
    expect(getSql()).toEqual({ mocked: true });
    expect(postgres).toHaveBeenCalledWith(
      "postgres://db.example/app",
      expect.objectContaining({ max: 5, ssl: "require" }),
    );
  });
});
