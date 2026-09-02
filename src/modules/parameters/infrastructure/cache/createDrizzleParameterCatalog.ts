import { eq, sql } from "drizzle-orm";
import { getDb, type AppDatabase } from "@/shared/infrastructure/db/client";
import { parameterAliases, parameters, seenParameterCodes } from "@/shared/infrastructure/db/schema";
import type { ParameterCatalogPort } from "../../application/ports/ParameterCatalogPort";
import type { CanonicalParameter, ParameterAlias } from "../../domain/Parameter";
import type { SeenParameterCode } from "../../domain/createParameterCatalog";

export function createDrizzleParameterCatalog(
  db: AppDatabase = getDb(),
): ParameterCatalogPort {
  return {
    async persist(parameter) {
      await db
        .insert(parameters)
        .values({
          id: parameter.id,
          name: parameter.name,
          cas: parameter.cas,
          category: parameter.category,
          canonicalUnit: parameter.canonicalUnit,
          displayPriority: parameter.displayPriority,
          origin: parameter.origin,
        })
        .onConflictDoUpdate({
          target: parameters.id,
          set: {
            name: parameter.name,
            cas: parameter.cas,
            category: parameter.category,
            canonicalUnit: parameter.canonicalUnit,
            displayPriority: parameter.displayPriority,
            origin: parameter.origin,
          },
        });

      if (parameter.aliases.length === 0) {
        return;
      }

      await db
        .insert(parameterAliases)
        .values(
          parameter.aliases.map((alias) => ({
            source: alias.source,
            externalCode: alias.externalCode,
            label: alias.label,
            parameterId: parameter.id,
          })),
        )
        .onConflictDoUpdate({
          target: [parameterAliases.source, parameterAliases.externalCode],
          set: {
            label: sql`excluded.label`,
            parameterId: parameter.id,
          },
        });
    },

    async listImported() {
      const rows = await db
        .select()
        .from(parameters)
        .where(eq(parameters.origin, "import"));
      const aliases = await db.select().from(parameterAliases);
      const byId = new Map<string, ParameterAlias[]>();
      for (const alias of aliases) {
        const list = byId.get(alias.parameterId) ?? [];
        list.push({
          source: alias.source as ParameterAlias["source"],
          externalCode: alias.externalCode,
          label: alias.label,
        });
        byId.set(alias.parameterId, list);
      }

      return rows.map(
        (row): CanonicalParameter => ({
          id: row.id,
          name: row.name,
          cas: row.cas,
          category: row.category as CanonicalParameter["category"],
          canonicalUnit: row.canonicalUnit,
          displayPriority: row.displayPriority,
          origin: "import",
          aliases: byId.get(row.id) ?? [],
        }),
      );
    },

    async listSeenCodes() {
      const rows = await db.select().from(seenParameterCodes);
      const unique = new Map<string, SeenParameterCode>();
      for (const row of rows) {
        if (!unique.has(row.code)) {
          unique.set(row.code, {
            code: row.code,
            label: row.label,
            unit: row.unit,
          });
        }
      }
      return [...unique.values()];
    },
  };
}
