import { afterEach, describe, expect, it } from "vitest";
import { getDatabasePoolMax, getDatabaseUrl, shouldRequireDatabaseSsl } from "./env";

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

  it("reads a positive pool size and falls back otherwise", () => {
    const previous = process.env.DATABASE_POOL_MAX;
    process.env.DATABASE_POOL_MAX = "5";
    expect(getDatabasePoolMax()).toBe(5);
    process.env.DATABASE_POOL_MAX = "nope";
    expect(getDatabasePoolMax()).toBe(5);
    delete process.env.DATABASE_POOL_MAX;
    expect(getDatabasePoolMax()).toBe(5);
    if (previous === undefined) {
      delete process.env.DATABASE_POOL_MAX;
    } else {
      process.env.DATABASE_POOL_MAX = previous;
    }
  });

  it("requires ssl except on loopback and docker service names", () => {
    const previous = process.env.DATABASE_SSL;
    delete process.env.DATABASE_SSL;
    expect(shouldRequireDatabaseSsl("postgres://db.example:5432/app")).toBe(true);
    expect(shouldRequireDatabaseSsl("postgres://localhost:54332/app")).toBe(false);
    expect(shouldRequireDatabaseSsl("postgres://127.0.0.1:54332/app")).toBe(false);
    expect(shouldRequireDatabaseSsl("postgres://postgres:5432/app")).toBe(false);
    expect(shouldRequireDatabaseSsl("not-a-url-but-localhost")).toBe(false);
    expect(shouldRequireDatabaseSsl("not-a-url")).toBe(true);
    process.env.DATABASE_SSL = "0";
    expect(shouldRequireDatabaseSsl("postgres://db.example:5432/app")).toBe(false);
    process.env.DATABASE_SSL = "false";
    expect(shouldRequireDatabaseSsl("postgres://db.example:5432/app")).toBe(false);
    process.env.DATABASE_SSL = "1";
    expect(shouldRequireDatabaseSsl("postgres://postgres:5432/app")).toBe(true);
    process.env.DATABASE_SSL = "true";
    expect(shouldRequireDatabaseSsl("postgres://postgres:5432/app")).toBe(true);
    if (previous === undefined) {
      delete process.env.DATABASE_SSL;
    } else {
      process.env.DATABASE_SSL = previous;
    }
  });
});
