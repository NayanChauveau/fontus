import { sql } from "drizzle-orm";
import type { HealthPing, HealthPort } from "@/application/ports/HealthPort";
import { getDb } from "@/shared/infrastructure/db/client";
import { describeDatabaseFailure } from "@/shared/infrastructure/db/describeDatabaseFailure";

function failureDetail(error: unknown, fallback: string): string {
  return describeDatabaseFailure(error)?.detail ?? fallback;
}

export function createHealthPortAdapter(): HealthPort {
  return {
    async ping(): Promise<HealthPing> {
      const at = new Date();
      try {
        await getDb().execute(sql`select 1`);
      } catch (error) {
        return {
          ok: false,
          postgres: false,
          schema: false,
          detail: failureDetail(error, "Postgres did not answer."),
          at,
        };
      }

      try {
        await getDb().execute(sql`select 1 from public.udis limit 0`);
        return {
          ok: true,
          postgres: true,
          schema: true,
          detail: null,
          at,
        };
      } catch (error) {
        return {
          ok: false,
          postgres: true,
          schema: false,
          detail: failureDetail(
            error,
            "Required tables are missing. Migrations were not applied.",
          ),
          at,
        };
      }
    },
  };
}