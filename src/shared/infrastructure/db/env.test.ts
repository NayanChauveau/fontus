import { afterEach, describe, expect, it } from "vitest";
import { getDatabaseUrl } from "./env";

describe("getDatabaseUrl", () => {
  const previous = process.env.DATABASE_URL;

  afterEach(() => {
    if (previous === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = previous;
    }
  });

  it("reads DATABASE_URL", () => {
    process.env.DATABASE_URL = "postgres://local";
    expect(getDatabaseUrl()).toBe("postgres://local");
  });

  it("throws when unset", () => {
    delete process.env.DATABASE_URL;
    expect(() => getDatabaseUrl()).toThrow("DATABASE_URL is not set");
  });
});
