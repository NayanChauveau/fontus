import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import postgres from "postgres";

// Shared server log format (same keys as src/shared/infrastructure/observability and as
// manon-karsenti's pino logger): one JSON object per line, read by Alloy and Grafana.
function log(level, msg, fields = {}) {
  const line = JSON.stringify({
    level,
    time: new Date().toISOString(),
    service: "fontus",
    msg,
    ...fields,
    scope: "migrations",
  });
  if (level === "error") {
    console.error(line);
  } else {
    console.log(line);
  }
}

function serializeError(error) {
  if (error instanceof Error) {
    return {
      type: error.name,
      message: error.message,
      stack: error.stack ?? null,
    };
  }
  return { type: typeof error, message: String(error), stack: null };
}

function listSqlMigrationFileNames(names) {
  return names.filter((name) => name.endsWith(".sql")).sort();
}

function shouldRequireDatabaseSsl(url) {
  const forced = process.env.DATABASE_SSL;
  if (forced === "0" || forced === "false") {
    return false;
  }
  if (forced === "1" || forced === "true") {
    return true;
  }

  try {
    const { hostname } = new URL(url);
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return false;
    }
    return hostname.includes(".");
  } catch {
    return !url.includes("localhost") && !url.includes("127.0.0.1");
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function connectWithRetry(connect, attempts = 15, delayMs = 2000) {
  let lastError;
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

const url = process.env.DATABASE_URL;
if (!url) {
  log("error", "migrations_failed", {
    err: serializeError(new Error("DATABASE_URL is not set")),
  });
  process.exitCode = 1;
} else {
  try {
    const dir =
      process.env.MIGRATIONS_DIR ??
      new URL("./migrations", import.meta.url).pathname;
    const names = listSqlMigrationFileNames(await readdir(dir));
    const sql = await connectWithRetry(async () => {
      const client = postgres(url, {
        max: 1,
        ssl: shouldRequireDatabaseSsl(url) ? "require" : undefined,
        // Idempotent migrations re-run on every release: Postgres notices ("already exists,
        // skipping") become one shared-format line each instead of multi-line objects.
        onnotice: (notice) =>
          log("info", "migration_notice", { notice: notice.message }),
      });
      await client`select 1`;
      return client;
    });

    try {
      for (const name of names) {
        await sql.unsafe(await readFile(join(dir, name), "utf8"));
        log("info", "migration_applied", { file: name });
      }
      log("info", "migrations_ok", { count: names.length });
    } finally {
      await sql.end({ timeout: 5 });
    }
  } catch (error) {
    log("error", "migrations_failed", { err: serializeError(error) });
    process.exitCode = 1;
  }
}
