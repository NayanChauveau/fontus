import { eq, inArray } from "drizzle-orm";
import { getDb, type AppDatabase } from "@/shared/infrastructure/db/client";
import { measurements, samples, syncJobs, udis } from "@/shared/infrastructure/db/schema";
import type { AnalysisSample } from "../../domain/Analysis";
import type { AnalysesCachePort } from "../../application/ports/AnalysesCachePort";

export function udiSyncScope(networkCode: string): string {
  return `udi:${networkCode}`;
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

      if (!job || !job.windowFrom) {
        return null;
      }

      const sampleRows = await db
        .select()
        .from(samples)
        .where(eq(samples.udiCode, networkCode));

      const sampleCodes = sampleRows.map((row) => row.code);
      const measurementRows = sampleCodes.length
        ? await db
            .select()
            .from(measurements)
            .where(inArray(measurements.sampleCode, sampleCodes))
        : [];

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
      await db
        .insert(udis)
        .values({ code: input.networkCode, name: input.networkCode })
        .onConflictDoNothing({ target: udis.code });

      const existing = await db
        .select({ code: samples.code })
        .from(samples)
        .where(eq(samples.udiCode, input.networkCode));
      const existingCodes = existing.map((row) => row.code);

      if (existingCodes.length > 0) {
        await db
          .delete(measurements)
          .where(inArray(measurements.sampleCode, existingCodes));
        await db.delete(samples).where(eq(samples.udiCode, input.networkCode));
      }

      if (input.samples.length > 0) {
        await db.insert(samples).values(
          input.samples.map((sample) => ({
            code: sample.code,
            udiCode: input.networkCode,
            sampledAt: sample.sampledAt,
            conclusion: sample.conclusion,
            conformiteLimitesBact: sample.conformiteLimitesBact,
            conformiteLimitesPc: sample.conformiteLimitesPc,
            communeInsee: sample.communeInsee,
            source: sample.source,
          })),
        );

        const rows = input.samples.flatMap((sample) =>
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

        const chunkSize = 500;
        for (let index = 0; index < rows.length; index += chunkSize) {
          await db
            .insert(measurements)
            .values(rows.slice(index, index + chunkSize));
        }
      }

      await db
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
    },
  };
}
