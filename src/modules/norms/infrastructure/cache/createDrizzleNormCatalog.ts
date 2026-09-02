import { getDb, type AppDatabase } from "@/shared/infrastructure/db/client";
import { jurisdictions, thresholdVersions } from "@/shared/infrastructure/db/schema";
import type { NormCatalogPort } from "../../application/ports/NormCatalogPort";
import type {
  Jurisdiction,
  ThresholdKind,
  ThresholdOperator,
  ThresholdVersion,
} from "../../domain/ThresholdVersion";

export function createDrizzleNormCatalog(
  db: AppDatabase = getDb(),
): NormCatalogPort {
  return {
    async persist(version) {
      await db
        .insert(jurisdictions)
        .values({ id: version.jurisdiction, name: version.jurisdiction })
        .onConflictDoNothing({ target: jurisdictions.id });

      await db
        .insert(thresholdVersions)
        .values(toRow(version))
        .onConflictDoUpdate({
          target: thresholdVersions.id,
          set: {
            parameterId: version.parameterId,
            jurisdiction: version.jurisdiction,
            unit: version.unit,
            value: String(version.value),
            valueMax: version.valueMax === null ? null : String(version.valueMax),
            operator: version.operator,
            kind: version.kind,
            binding: version.binding,
            validFrom: toDateString(version.validFrom),
            validTo: version.validTo ? toDateString(version.validTo) : null,
            citation: version.citation,
            sourceUrl: version.sourceUrl,
          },
        });
    },

    async list() {
      const rows = await db.select().from(thresholdVersions);
      return rows.map(fromRow);
    },
  };
}

function toRow(version: ThresholdVersion) {
  return {
    id: version.id,
    parameterId: version.parameterId,
    jurisdiction: version.jurisdiction,
    unit: version.unit,
    value: String(version.value),
    valueMax: version.valueMax === null ? null : String(version.valueMax),
    operator: version.operator,
    kind: version.kind,
    binding: version.binding,
    validFrom: toDateString(version.validFrom),
    validTo: version.validTo ? toDateString(version.validTo) : null,
    citation: version.citation,
    sourceUrl: version.sourceUrl,
  };
}

function fromRow(row: {
  id: string;
  parameterId: string;
  jurisdiction: string;
  unit: string;
  value: string;
  valueMax: string | null;
  operator: string;
  kind: string;
  binding: boolean;
  validFrom: string;
  validTo: string | null;
  citation: string;
  sourceUrl: string;
}): ThresholdVersion {
  return {
    id: row.id,
    parameterId: row.parameterId,
    jurisdiction: row.jurisdiction as Jurisdiction,
    unit: row.unit,
    value: Number(row.value),
    valueMax: row.valueMax === null ? null : Number(row.valueMax),
    operator: row.operator as ThresholdOperator,
    kind: row.kind as ThresholdKind,
    binding: row.binding,
    validFrom: new Date(`${row.validFrom}T00:00:00.000Z`),
    validTo: row.validTo ? new Date(`${row.validTo}T00:00:00.000Z`) : null,
    citation: row.citation,
    sourceUrl: row.sourceUrl,
  };
}

function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}
