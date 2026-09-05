import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  applyPendingMigrations,
  applySqlFiles,
  connectWithRetry,
  createMigrationSqlClient,
  listSqlMigrationFileNames,
  resolveMigrationsDirectory,
  type MigrationSql,
} from "./applyMigrations";

const { postgres } = vi.hoisted(() => ({
  postgres: vi.fn(),
}));

vi.mock("postgres", () => ({
  default: postgres,
}));

function createFakeSql(overrides: Partial<MigrationSql> = {}): MigrationSql {
  const client = Object.assign(
    vi.fn(async () => [{ ok: true }]),
    {
      unsafe: vi.fn(async () => undefined),
      end: vi.fn(async () => undefined),
      ...overrides,
    },
  );
  return client;
}

describe("listSqlMigrationFileNames", () => {
  it("keeps only sql files in timestamp order", () => {
    expect(
      listSqlMigrationFileNames([
        "20260902170000_hardening.sql",
        "README.md",
        "20260902120000_network_cache.sql",
        "notes.txt",
      ]),
    ).toEqual([
      "20260902120000_network_cache.sql",
      "20260902170000_hardening.sql",
    ]);
  });

  it("matches the checked-in cache migrations", async () => {
    const { readdir } = await import("node:fs/promises");
    expect(
      listSqlMigrationFileNames(await readdir("supabase/migrations")),
    ).toEqual([
      "20260902120000_network_cache.sql",
      "20260902130000_analyses_cache.sql",
      "20260902140000_parameters.sql",
      "20260902160000_norms.sql",
      "20260902170000_hardening.sql",
    ]);
  });
});

describe("resolveMigrationsDirectory", () => {
  it("prefers MIGRATIONS_DIR when set", async () => {
    await expect(
      resolveMigrationsDirectory({ envDir: "/app/migrations" }),
    ).resolves.toBe("/app/migrations");
  });

  it("returns the first readable candidate", async () => {
    const access = vi
      .fn<(path: string) => Promise<void>>()
      .mockRejectedValueOnce(new Error("missing"))
      .mockResolvedValueOnce(undefined);

    await expect(
      resolveMigrationsDirectory({
        cwd: "/app",
        access,
        candidates: ["supabase/migrations", "migrations"],
      }),
    ).resolves.toBe("/app/migrations");
  });

  it("throws when no candidate exists", async () => {
    await expect(
      resolveMigrationsDirectory({
        cwd: "/empty",
        access: async () => {
          throw new Error("missing");
        },
      }),
    ).rejects.toThrow("No SQL migrations directory found");
  });

  it("finds the repo migrations directory", async () => {
    await expect(resolveMigrationsDirectory()).resolves.toMatch(
      /supabase\/migrations$/,
    );
  });
});

describe("applySqlFiles", () => {
  it("applies files in order and logs each one", async () => {
    const exec = vi.fn<(sql: string) => Promise<void>>(async () => undefined);
    const log = vi.fn<(message: string) => void>();

    await applySqlFiles(
      exec,
      [
        { name: "a.sql", sql: "create table a ();" },
        { name: "b.sql", sql: "create table b ();" },
      ],
      log,
    );

    expect(exec).toHaveBeenNthCalledWith(1, "create table a ();");
    expect(exec).toHaveBeenNthCalledWith(2, "create table b ();");
    expect(log).toHaveBeenNthCalledWith(1, "applied a.sql");
    expect(log).toHaveBeenNthCalledWith(2, "applied b.sql");
  });

  it("logs to stdout by default", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);
    await applySqlFiles(async () => undefined, [
      { name: "a.sql", sql: "select 1;" },
    ]);
    expect(log).toHaveBeenCalledWith("applied a.sql");
    log.mockRestore();
  });
});

describe("connectWithRetry", () => {
  it("returns the first successful connection", async () => {
    const sleep = vi.fn(async () => undefined);
    const connect = vi
      .fn()
      .mockRejectedValueOnce(new Error("boot"))
      .mockResolvedValueOnce("ready");

    await expect(
      connectWithRetry(connect, { attempts: 3, delayMs: 10, sleep }),
    ).resolves.toBe("ready");
    expect(sleep).toHaveBeenCalledWith(10);
  });

  it("throws the last error after exhausting attempts", async () => {
    const sleep = vi.fn(async () => undefined);

    await expect(
      connectWithRetry(
        async () => {
          throw new Error("down");
        },
        { attempts: 2, delayMs: 5, sleep },
      ),
    ).rejects.toThrow("down");
    expect(sleep).toHaveBeenCalledOnce();
  });

  it("uses the default sleeper between attempts", async () => {
    vi.useFakeTimers();
    const connect = vi
      .fn()
      .mockRejectedValueOnce(new Error("boot"))
      .mockResolvedValueOnce("ready");
    const pending = connectWithRetry(connect, { attempts: 2 });
    await vi.advanceTimersByTimeAsync(2000);
    await expect(pending).resolves.toBe("ready");
    vi.useRealTimers();
  });
});

describe("createMigrationSqlClient", () => {
  const previousSsl = process.env.DATABASE_SSL;

  afterEach(() => {
    if (previousSsl === undefined) {
      delete process.env.DATABASE_SSL;
    } else {
      process.env.DATABASE_SSL = previousSsl;
    }
    postgres.mockClear();
  });

  it("opens a single connection without ssl on a docker host", () => {
    process.env.DATABASE_SSL = "0";
    createMigrationSqlClient("postgres://postgres:5432/fontus");
    expect(postgres).toHaveBeenCalledWith(
      "postgres://postgres:5432/fontus",
      expect.objectContaining({ max: 1, ssl: undefined }),
    );
  });

  it("requires ssl when asked", () => {
    process.env.DATABASE_SSL = "1";
    createMigrationSqlClient("postgres://db.example:5432/fontus");
    expect(postgres).toHaveBeenCalledWith(
      "postgres://db.example:5432/fontus",
      expect.objectContaining({ max: 1, ssl: "require" }),
    );
  });
});

describe("applyPendingMigrations", () => {
  it("applies sorted sql then closes the client", async () => {
    const sql = createFakeSql();
    const log = vi.fn();

    await applyPendingMigrations({
      resolveDir: async () => "/migrations",
      readDirectory: async () => ["b.sql", "readme.txt", "a.sql"],
      readSql: async (path) => `contents of ${path}`,
      createSql: () => sql,
      getUrl: () => "postgres://postgres:5432/fontus",
      log,
      attempts: 1,
    });

    expect(sql).toHaveBeenCalled();
    expect(sql.unsafe).toHaveBeenCalledTimes(2);
    expect(sql.unsafe).toHaveBeenNthCalledWith(1, "contents of /migrations/a.sql");
    expect(sql.unsafe).toHaveBeenNthCalledWith(2, "contents of /migrations/b.sql");
    expect(log).toHaveBeenNthCalledWith(1, "applied a.sql");
    expect(log).toHaveBeenNthCalledWith(2, "applied b.sql");
    expect(sql.end).toHaveBeenCalledWith({ timeout: 5 });
  });

  it("closes the client when a migration fails", async () => {
    const sql = createFakeSql({
      unsafe: vi.fn(async () => {
        throw new Error("bad sql");
      }),
    });

    await expect(
      applyPendingMigrations({
        resolveDir: async () => "/migrations",
        readDirectory: async () => ["a.sql"],
        readSql: async () => "nope",
        createSql: () => sql,
        getUrl: () => "postgres://postgres:5432/fontus",
        attempts: 1,
      }),
    ).rejects.toThrow("bad sql");
    expect(sql.end).toHaveBeenCalledWith({ timeout: 5 });
  });

  it("reads MIGRATIONS_DIR from the environment", async () => {
    const previous = process.env.MIGRATIONS_DIR;
    const previousUrl = process.env.DATABASE_URL;
    const dir = await mkdtemp(join(tmpdir(), "fontus-mig-"));
    await writeFile(join(dir, "20260902120000_demo.sql"), "select 1;");
    process.env.MIGRATIONS_DIR = dir;
    process.env.DATABASE_URL = "postgres://postgres:5432/fontus";
    const sql = createFakeSql();

    try {
      await applyPendingMigrations({
        createSql: () => sql,
        attempts: 1,
        log: () => undefined,
      });
      expect(sql.unsafe).toHaveBeenCalledWith("select 1;");
    } finally {
      if (previous === undefined) {
        delete process.env.MIGRATIONS_DIR;
      } else {
        process.env.MIGRATIONS_DIR = previous;
      }
      if (previousUrl === undefined) {
        delete process.env.DATABASE_URL;
      } else {
        process.env.DATABASE_URL = previousUrl;
      }
    }
  });

  it("opens the default postgres client", async () => {
    const previousUrl = process.env.DATABASE_URL;
    const previousDir = process.env.MIGRATIONS_DIR;
    const dir = await mkdtemp(join(tmpdir(), "fontus-mig-default-"));
    await writeFile(join(dir, "001.sql"), "select 2;");
    process.env.DATABASE_URL = "postgres://postgres:5432/fontus";
    process.env.MIGRATIONS_DIR = dir;
    const sql = createFakeSql();
    postgres.mockReturnValueOnce(sql);

    try {
      await applyPendingMigrations({
        attempts: 1,
        log: () => undefined,
      });
      expect(postgres).toHaveBeenCalledWith(
        "postgres://postgres:5432/fontus",
        expect.objectContaining({ max: 1 }),
      );
      expect(sql.unsafe).toHaveBeenCalledWith("select 2;");
    } finally {
      if (previousDir === undefined) {
        delete process.env.MIGRATIONS_DIR;
      } else {
        process.env.MIGRATIONS_DIR = previousDir;
      }
      if (previousUrl === undefined) {
        delete process.env.DATABASE_URL;
      } else {
        process.env.DATABASE_URL = previousUrl;
      }
    }
  });
});
