import type { MeasurementQualifier } from "./parseAlphanumericResult";

export type AnalysisMeasurement = {
  parameterCode: string;
  parameterLabel: string;
  rawText: string;
  numericValue: number | null;
  qualifier: MeasurementQualifier;
  unit: string | null;
};

export type AnalysisSample = {
  code: string;
  udiCode: string;
  sampledAt: Date;
  conclusion: string | null;
  conformiteLimitesBact: string | null;
  conformiteLimitesPc: string | null;
  communeInsee: string | null;
  source: string;
  measurements: AnalysisMeasurement[];
};

export const ANALYSIS_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
export const HUBEAU_ROW_HARD_CAP = 20_000;
export const HUBEAU_ROW_SOFT_CAP = 10_000;

export function isFreshAnalysisSync(fetchedAt: Date, now: Date): boolean {
  return now.getTime() - fetchedAt.getTime() < ANALYSIS_CACHE_TTL_MS;
}

export function latestSample(samples: AnalysisSample[]): AnalysisSample | null {
  if (samples.length === 0) {
    return null;
  }
  return samples.reduce((latest, sample) =>
    sample.sampledAt > latest.sampledAt ? sample : latest,
  );
}
