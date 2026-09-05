import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import postgres from "postgres";

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
  console.error("migrations_failed", "DATABASE_URL is not set");
  process.exit(1);
}

const dir = process.env.MIGRATIONS_DIR ?? new URL("./migrations", import.meta.url).pathname;
const names = listSqlMigrationFileNames(await readdir(dir));
const sql = await connectWithRetry(async () => {
  const client = postgres(url, {
    max: 1,
    ssl: shouldRequireDatabaseSsl(url) ? "require" : undefined,
  });
  await client`select 1`;
  return client;
});

try {
  for (const name of names) {
    await sql.unsafe(await readFile(join(dir, name), "utf8"));
    console.log(`applied ${name}`);
  }
  console.log("migrations_ok");
} catch (error) {
  console.error("migrations_failed", error);
  process.exitCode = 1;
} finally {
  await sql.end({ timeout: 5 });
}
