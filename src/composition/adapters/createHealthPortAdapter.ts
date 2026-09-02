import { sql } from "drizzle-orm";
import type { HealthPing, HealthPort } from "@/application/ports/HealthPort";
import { getDb } from "@/shared/infrastructure/db/client";

export function createHealthPortAdapter(): HealthPort {
  return {
    async ping(): Promise<HealthPing> {
      await getDb().execute(sql`select 1`);
      return { ok: true, at: new Date() };
    },
  };
}
