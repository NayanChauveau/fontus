import { describe, expect, it, vi } from "vitest";

vi.mock("postgres", () => ({
  default: () => ({ mocked: true }),
}));

vi.mock("drizzle-orm/postgres-js", () => ({
  drizzle: () => ({ tagged: "db" }),
}));

vi.mock("./env", () => ({
  getDatabaseUrl: () => "postgres://test",
}));

describe("getDb", () => {
  it("returns a singleton", async () => {
    const { getDb } = await import("./client");
    expect(getDb()).toBe(getDb());
    expect(getDb()).toEqual({ tagged: "db" });
  });
});
