import { eq, inArray, sql } from "drizzle-orm";
import { getDb, getSql, type AppDatabase } from "@/shared/infrastructure/db/client";
import {
  measurements,
  samples,
  seenParameterCodes,
  syncJobs,
  udis,
} from "@/shared/infrastructure/db/schema";
import type { AnalysisSample } from "../../domain/Analysis";
import type { AnalysesCachePort } from "../../application/ports/AnalysesCachePort";

export function udiSyncScope(networkCode: string): string {
  return `udi:${networkCode}`;
}

const WRITE_CHUNK_SIZE = 500;

export function uniqueAnalysisSamples(
  samples: AnalysisSample[],
): AnalysisSample[] {
  const merged = new Map<string, AnalysisSample>();
  for (const sample of samples) {
    const existing = merged.get(sample.code);
    if (!existing) {
      merged.set(sample.code, {
        ...sample,
        measurements: [...sample.measurements],
      });
      continue;
    }
    for (const measurement of sample.measurements) {
      if (
        !existing.measurements.some(
          (item) => item.parameterCode === measurement.parameterCode,
        )
      ) {
        existing.measurements.push(measurement);
      }
    }
  }
  return [...merged.values()];
}

export function sampleCodesToReplace(
  incomingCodes: readonly string[],
  existingUdiCodes: readonly string[],
): string[] {
  return [...new Set([...incomingCodes, ...existingUdiCodes])];
}

export function udiAdvisoryLockKey(networkCode: string): number {
  let hash = 0;
  const scope = udiSyncScope(networkCode);
  for (let index = 0; index < scope.length; index += 1) {
    hash = (Math.imul(31, hash) + scope.charCodeAt(index)) | 0;
  }
  return hash;
}

export async function withReservedAdvisoryLock<T>(
  key: number,
  work: () => Promise<T>,
  reserve: () => Promise<{
    (strings: TemplateStringsArray, ...values: unknown[]): unknown;
    release(): void;
  }>,
): Promise<T> {
  const reserved = await reserve();
  try {
    await reserved`select pg_advisory_lock(${key})`;
    try {
      return await work();
    } finally {
      await reserved`select pg_advisory_unlock(${key})`;
    }
  } finally {
    reserved.release();
  }
}

export function createDrizzleAnalysesCache(
  db: AppDatabase = getDb(),
): AnalysesCachePort {
  return {
    async read(networkCode) {
      const [job] = await db
        .select()
        .from(syncJobs)
        .where(eq(syncJobs.scope, udiSyncScope(networkCode)))
        .limit(1);

      if (!job || !job.windowFrom || job.status !== "ok") {
        return null;
      }

      const sampleRows = await db
        .select()
        .from(samples)
        .where(eq(samples.udiCode, networkCode));

      if (sampleRows.length === 0) {
        return null;
      }

      const sampleCodes = sampleRows.map((row) => row.code);
      const measurementRows = await db
        .select()
        .from(measurements)
        .where(inArray(measurements.sampleCode, sampleCodes));

      const bySample = new Map(
        sampleRows.map((row) => [
          row.code,
          {
            code: row.code,
            udiCode: row.udiCode,
            sampledAt: row.sampledAt,
            conclusion: row.conclusion,
            conformiteLimitesBact: row.conformiteLimitesBact,
            conformiteLimitesPc: row.conformiteLimitesPc,
            communeInsee: row.communeInsee,
            source: row.source,
            measurements: [] as AnalysisSample["measurements"],
          } satisfies AnalysisSample,
        ]),
      );

      for (const row of measurementRows) {
        const sample = bySample.get(row.sampleCode);
        if (!sample) {
          continue;
        }
        sample.measurements.push({
          parameterCode: row.parameterCode,
          parameterLabel: row.parameterLabel,
          rawText: row.rawText,
          numericValue: row.numericValue === null ? null : Number(row.numericValue),
          qualifier: row.qualifier as AnalysisSample["measurements"][number]["qualifier"],
          unit: row.unit,
        });
      }

      return {
        networkCode,
        samples: [...bySample.values()],
        fetchedAt: job.fetchedAt,
        windowFrom: job.windowFrom,
      };
    },

    async write(input) {
      const snapshot = uniqueAnalysisSamples(input.samples);
      if (snapshot.length === 0) {
        return;
      }

      await db.transaction(async (tx) => {
        await tx
          .insert(udis)
          .values({ code: input.networkCode, name: input.networkCode })
          .onConflictDoNothing({ target: udis.code });

        const existing = await tx
          .select({ code: samples.code })
          .from(samples)
          .where(eq(samples.udiCode, input.networkCode));
        const codesToReplace = sampleCodesToReplace(
          snapshot.map((sample) => sample.code),
          existing.map((row) => row.code),
        );

        for (const chunk of chunkItems(codesToReplace, WRITE_CHUNK_SIZE)) {
          await tx
            .delete(measurements)
            .where(inArray(measurements.sampleCode, chunk));
          await tx.delete(samples).where(inArray(samples.code, chunk));
        }

        const sampleRows = snapshot.map((sample) => ({
          code: sample.code,
          udiCode: input.networkCode,
          sampledAt: sample.sampledAt,
          conclusion: sample.conclusion,
          conformiteLimitesBact: sample.conformiteLimitesBact,
          conformiteLimitesPc: sample.conformiteLimitesPc,
          communeInsee: sample.communeInsee,
          source: sample.source,
        }));
        for (const chunk of chunkItems(sampleRows, WRITE_CHUNK_SIZE)) {
          await tx.insert(samples).values(chunk);
        }

        const rows = snapshot.flatMap((sample) =>
          sample.measurements.map((measurement) => ({
            sampleCode: sample.code,
            parameterCode: measurement.parameterCode,
            parameterLabel: measurement.parameterLabel,
            rawText: measurement.rawText,
            numericValue:
              measurement.numericValue === null
                ? null
                : String(measurement.numericValue),
            qualifier: measurement.qualifier,
            unit: measurement.unit,
          })),
        );

        for (const chunk of chunkItems(rows, WRITE_CHUNK_SIZE)) {
          await tx.insert(measurements).values(chunk);
        }

        const seen = new Map<
          string,
          { code: string; label: string; unit: string | null }
        >();
        for (const row of rows) {
          if (!seen.has(row.parameterCode)) {
            seen.set(row.parameterCode, {
              code: row.parameterCode,
              label: row.parameterLabel,
              unit: row.unit,
            });
          }
        }
        if (seen.size > 0) {
          await tx
            .insert(seenParameterCodes)
            .values([...seen.values()])
            .onConflictDoUpdate({
              target: seenParameterCodes.code,
              set: {
                label: sql`excluded.label`,
                unit: sql`excluded.unit`,
              },
            });
        }

        await tx
          .insert(syncJobs)
          .values({
            scope: udiSyncScope(input.networkCode),
            fetchedAt: input.fetchedAt,
            windowFrom: input.windowFrom,
            status: "ok",
          })
          .onConflictDoUpdate({
            target: syncJobs.scope,
            set: {
              fetchedAt: input.fetchedAt,
              windowFrom: input.windowFrom,
              status: "ok",
            },
          });
      });
    },

    async withNetworkLock(networkCode, work) {
      return withReservedAdvisoryLock(udiAdvisoryLockKey(networkCode), work, () =>
        getSql().reserve(),
      );
    },
  };
}

function chunkItems<T>(items: readonly T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}
