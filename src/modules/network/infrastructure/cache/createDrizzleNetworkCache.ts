import { and, eq, sql } from "drizzle-orm";
import { getDb, type AppDatabase } from "@/shared/infrastructure/db/client";
import {
  communes,
  syncJobs,
  udiCommuneYears,
  udis,
} from "@/shared/infrastructure/db/schema";
import type { RawUdiLink } from "../../domain/DistributionNetwork";
import type { NetworkCachePort } from "../../application/ports/NetworkCachePort";

export function communeSyncScope(citycode: string, year: number): string {
  return `commune:${citycode}:${year}`;
}

export function createDrizzleNetworkCache(
  db: AppDatabase = getDb(),
): NetworkCachePort {
  return {
    async read(citycode, year) {
      const [job] = await db
        .select()
        .from(syncJobs)
        .where(eq(syncJobs.scope, communeSyncScope(citycode, year)))
        .limit(1);

      if (!job) {
        return null;
      }

      const rows = await db
        .select({
          citycode: udiCommuneYears.communeInsee,
          city: communes.name,
          networkCode: udiCommuneYears.udiCode,
          networkName: udis.name,
          neighborhood: udiCommuneYears.neighborhood,
          year: udiCommuneYears.year,
          supplyStartedOn: udiCommuneYears.supplyStartedOn,
        })
        .from(udiCommuneYears)
        .innerJoin(communes, eq(communes.insee, udiCommuneYears.communeInsee))
        .innerJoin(udis, eq(udis.code, udiCommuneYears.udiCode))
        .where(
          and(
            eq(udiCommuneYears.communeInsee, citycode),
            eq(udiCommuneYears.year, year),
          ),
        );

      const links: RawUdiLink[] = rows.map((row) => ({
        citycode: row.citycode,
        city: row.city,
        networkCode: row.networkCode,
        networkName: row.networkName,
        neighborhood: row.neighborhood,
        year: row.year,
        supplyStartedOn: row.supplyStartedOn,
      }));

      return {
        citycode,
        city: rows[0]?.city ?? "",
        year,
        links,
        fetchedAt: job.fetchedAt,
      };
    },

    async write(input) {
      await db
        .insert(communes)
        .values({
          insee: input.citycode,
          name: input.city || input.citycode,
        })
        .onConflictDoUpdate({
          target: communes.insee,
          set: { name: input.city || input.citycode },
        });

      if (input.links.length > 0) {
        await db
          .insert(udis)
          .values(
            uniqueByCode(input.links).map((link) => ({
              code: link.networkCode,
              name: link.networkName,
            })),
          )
          .onConflictDoUpdate({
            target: udis.code,
            set: { name: sql`excluded.name` },
          });
      }

      await db
        .delete(udiCommuneYears)
        .where(
          and(
            eq(udiCommuneYears.communeInsee, input.citycode),
            eq(udiCommuneYears.year, input.year),
          ),
        );

      if (input.links.length > 0) {
        await db.insert(udiCommuneYears).values(
          input.links.map((link) => ({
            communeInsee: input.citycode,
            udiCode: link.networkCode,
            year: input.year,
            neighborhood: link.neighborhood,
            supplyStartedOn: link.supplyStartedOn,
          })),
        );
      }

      await db
        .insert(syncJobs)
        .values({
          scope: communeSyncScope(input.citycode, input.year),
          fetchedAt: input.fetchedAt,
          windowFrom: null,
          status: input.links.length > 0 ? "ok" : "empty",
        })
        .onConflictDoUpdate({
          target: syncJobs.scope,
          set: {
            fetchedAt: input.fetchedAt,
            status: input.links.length > 0 ? "ok" : "empty",
          },
        });
    },
  };
}

function uniqueByCode(links: RawUdiLink[]): RawUdiLink[] {
  const seen = new Map<string, RawUdiLink>();
  for (const link of links) {
    if (!seen.has(link.networkCode)) {
      seen.set(link.networkCode, link);
    }
  }
  return [...seen.values()];
}
