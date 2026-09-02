import "server-only";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { getDatabasePoolMax, getDatabaseUrl, shouldRequireDatabaseSsl } from "./env";
import * as schema from "./schema";

export type AppDatabase = PostgresJsDatabase<typeof schema>;

let sql: ReturnType<typeof postgres> | undefined;
let db: AppDatabase | undefined;

function createSql() {
  const url = getDatabaseUrl();
  return postgres(url, {
    max: getDatabasePoolMax(),
    ssl: shouldRequireDatabaseSsl(url) ? "require" : undefined,
  });
}

export function getSql() {
  if (!sql) {
    sql = createSql();
  }
  return sql;
}

export function getDb(): AppDatabase {
  if (!db) {
    db = drizzle(getSql(), { schema });
  }
  return db;
}
