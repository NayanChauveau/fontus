import { access, readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import postgres from "postgres";
import { getDatabaseUrl, shouldRequireDatabaseSsl } from "./env";

const DEFAULT_MIGRATION_ATTEMPTS = 15;
const DEFAULT_MIGRATION_RETRY_MS = 2000;

export function listSqlMigrationFileNames(names: readonly string[]): string[] {
  return names.filter((name) => name.endsWith(".sql")).sort();
}

export async function resolveMigrationsDirectory(
  options: {
    cwd?: string;
    envDir?: string;
    access?: (path: string) => Promise<void>;
    candidates?: readonly string[];
  } = {},
): Promise<string> {
  if (options.envDir) {
    return options.envDir;
  }

  const cwd = options.cwd ?? process.cwd();
  const accessPath =
    options.access ?? ((path: string) => access(path).then(() => undefined));
  const candidates = options.candidates ?? ["supabase/migrations", "migrations"];

  for (const relative of candidates) {
    const dir = join(cwd, relative);
    try {
      await accessPath(dir);
      return dir;
    } catch {
      // try the next candidate
    }
  }

  throw new Error("No SQL migrations directory found");
}

export type MigrationSql = {
  unsafe: (text: string) => Promise<unknown>;
  end: (options?: { timeout: number }) => Promise<void>;
  (strings: TemplateStringsArray, ...values: unknown[]): Promise<unknown>;
};

export function createMigrationSqlClient(url: string): MigrationSql {
  return postgres(url, {
    max: 1,
    ssl: shouldRequireDatabaseSsl(url) ? "require" : undefined,
  }) as unknown as MigrationSql;
}

export async function applySqlFiles(
  exec: (sql: string) => Promise<unknown>,
  files: readonly { name: string; sql: string }[],
  log: (message: string) => void = console.log,
): Promise<void> {
  for (const file of files) {
    await exec(file.sql);
    log(`applied ${file.name}`);
  }
}

export async function connectWithRetry<T>(
  connect: () => Promise<T>,
  options: {
    attempts?: number;
    delayMs?: number;
    sleep?: (ms: number) => Promise<void>;
  } = {},
): Promise<T> {
  const attempts = options.attempts ?? DEFAULT_MIGRATION_ATTEMPTS;
  const delayMs = options.delayMs ?? DEFAULT_MIGRATION_RETRY_MS;
  const sleep =
    options.sleep ??
    ((ms: number) => new Promise((resolve) => setTimeout(resolve, ms)));

  let lastError: unknown;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await connect();
    } catch (error) {
      lastError = error;
      if (attempt < attempts - 1) {
        await sleep(delayMs);
      }
    }
  }

  throw lastError;
}

export async function applyPendingMigrations(
  deps: {
    resolveDir?: () => Promise<string>;
    readDirectory?: (dir: string) => Promise<string[]>;
    readSql?: (path: string) => Promise<string>;
    createSql?: (url: string) => MigrationSql;
    getUrl?: () => string;
    log?: (message: string) => void;
    sleep?: (ms: number) => Promise<void>;
    attempts?: number;
  } = {},
): Promise<void> {
  const dir = await (
    deps.resolveDir ??
    (() =>
      resolveMigrationsDirectory({
        envDir: process.env.MIGRATIONS_DIR,
      }))
  )();
  const names = listSqlMigrationFileNames(
    await (deps.readDirectory ?? readdir)(dir),
  );
  const readSql = deps.readSql ?? ((path: string) => readFile(path, "utf8"));
  const files = await Promise.all(
    names.map(async (name) => ({
      name,
      sql: await readSql(join(dir, name)),
    })),
  );

  const url = (deps.getUrl ?? getDatabaseUrl)();
  const createSql = deps.createSql ?? createMigrationSqlClient;
  const sql = await connectWithRetry(
    async () => {
      const client = createSql(url);
      await client`select 1`;
      return client;
    },
    { attempts: deps.attempts, sleep: deps.sleep },
  );

  try {
    await applySqlFiles((text) => sql.unsafe(text), files, deps.log);
  } finally {
    await sql.end({ timeout: 5 });
  }
}
