import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { getDatabaseUrl } from "./env";
import * as schema from "./schema";

export type AppDatabase = PostgresJsDatabase<typeof schema>;

let sql: ReturnType<typeof postgres> | undefined;
let db: AppDatabase | undefined;

export function getDb(): AppDatabase {
  if (!db) {
    sql = postgres(getDatabaseUrl(), { max: 1 });
    db = drizzle(sql, { schema });
  }
  return db;
}
