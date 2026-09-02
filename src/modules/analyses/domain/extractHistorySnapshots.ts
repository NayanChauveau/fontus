import type { AnalysisMeasurement, AnalysisSample, ParameterSnapshot } from "./Analysis";

const PFAS20_CODES = new Set(["8847", "SPFAS", "pfas20"]);

/** SANDRE / SISE des 20 PFAS — miroir de `PFAS20_MEMBER_IDS` pour éviter un import inter-module. */
const PFAS20_MEMBER_CODES = new Set([
  "5347",
  "PFOA",
  "6561",
  "PFOS",
  "5980",
  "5979",
  "5978",
  "5977",
  "6508",
  "6509",
  "6510",
  "6507",
  "6549",
  "6025",
  "6830",
  "6542",
  "6550",
  "8738",
  "8739",
  "8740",
  "8741",
  "8742",
]);

const HISTORY_CODES = new Set([
  "1340",
  "NO3",
  "nitrates",
  ...PFAS20_CODES,
  "1382",
  "PB",
  "lead",
]);

export function extractHistorySnapshots(
  samples: readonly AnalysisSample[],
): ParameterSnapshot[] {
  const snapshots: ParameterSnapshot[] = [];
  for (const sample of samples) {
    const keepCompanions = sample.measurements.some(isHistoryPfas20);
    for (const measurement of sample.measurements) {
      if (
        isHistorySeries(measurement) ||
        (keepCompanions && isPfas20Member(measurement))
      ) {
        snapshots.push({
          sampledAt: sample.sampledAt,
          measurement,
        });
      }
    }
  }
  snapshots.sort((left, right) => left.sampledAt.getTime() - right.sampledAt.getTime());
  return snapshots;
}

function isHistoryPfas20(measurement: AnalysisMeasurement): boolean {
  return matchesCodes(measurement, PFAS20_CODES);
}

function isPfas20Member(measurement: AnalysisMeasurement): boolean {
  return matchesCodes(measurement, PFAS20_MEMBER_CODES);
}

function isHistorySeries(measurement: AnalysisMeasurement): boolean {
  return matchesCodes(measurement, HISTORY_CODES);
}

function matchesCodes(
  measurement: AnalysisMeasurement,
  codes: ReadonlySet<string>,
): boolean {
  return (
    codes.has(measurement.parameterCode) ||
    (measurement.siseCode != null && codes.has(measurement.siseCode))
  );
}
