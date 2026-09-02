import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { getDatabaseUrl } from "./env";

let sql: ReturnType<typeof postgres> | undefined;
let db: PostgresJsDatabase | undefined;

export function getDb(): PostgresJsDatabase {
  if (!db) {
    sql = postgres(getDatabaseUrl(), { max: 1 });
    db = drizzle(sql);
  }
  return db;
}
