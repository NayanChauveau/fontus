import { spawnSync } from "node:child_process";
import path from "node:path";
import { describe, expect, it } from "vitest";

// scripts/run-migrations.mjs runs alone in the container before `node server.js`, so it carries
// its own copy of the shared log format (no import from src).
const script = path.resolve(import.meta.dirname, "../../../../scripts/run-migrations.mjs");

function run(env: Record<string, string>) {
  const base = { ...process.env };
  delete base.DATABASE_URL;
  delete base.MIGRATIONS_DIR;
  const result = spawnSync(process.execPath, [script], {
    env: { ...base, ...env },
    encoding: "utf8",
    timeout: 20_000,
  });
  const lines = `${result.stdout}${result.stderr}`
    .split("\n")
    .filter((line) => line.length > 0);
  return { status: result.status, lines };
}

describe("scripts/run-migrations.mjs", () => {
  it("logs a missing DATABASE_URL as one shared-format JSON error line", () => {
    const { status, lines } = run({});
    expect(status).toBe(1);
    expect(lines).toHaveLength(1);
    expect(JSON.parse(lines[0] ?? "{}")).toEqual({
      level: "error",
      time: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T.*Z$/),
      service: "fontus",
      msg: "migrations_failed",
      err: {
        type: "Error",
        message: "DATABASE_URL is not set",
        stack: expect.stringContaining("Error: DATABASE_URL is not set"),
      },
      scope: "migrations",
    });
  });

  it("logs a failure with its stack on a single line", () => {
    const { status, lines } = run({
      DATABASE_URL: "postgres://user:secret@127.0.0.1:1/db",
      MIGRATIONS_DIR: "/nonexistent-fontus-migrations",
    });
    expect(status).toBe(1);
    expect(lines).toHaveLength(1);
    const line = JSON.parse(lines[0] ?? "{}");
    expect(line).toMatchObject({
      level: "error",
      service: "fontus",
      msg: "migrations_failed",
      err: { message: expect.stringContaining("ENOENT") },
    });
    expect(lines[0]).not.toContain("secret");
  });
});
