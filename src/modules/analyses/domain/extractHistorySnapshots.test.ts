import { describe, expect, it } from "vitest";
import type { AnalysisSample } from "./Analysis";
import { extractHistorySnapshots } from "./extractHistorySnapshots";

describe("extractHistorySnapshots", () => {
  it("keeps nitrates, PFAS-20 and lead, sorted by date", () => {
    const snapshots = extractHistorySnapshots([
      sample("b", "2026-06-01T00:00:00.000Z", [
        { parameterCode: "1340", siseCode: "NO3", label: "Nitrates" },
        { parameterCode: "1339", siseCode: "NO2", label: "Nitrites" },
      ]),
      sample("a", "2026-01-01T00:00:00.000Z", [
        { parameterCode: "8847", siseCode: "SPFAS", label: "PFAS-20" },
        { parameterCode: "1382", siseCode: "PB", label: "Plomb" },
      ]),
      sample("c", "2026-03-01T00:00:00.000Z", [
        { parameterCode: "NO3", siseCode: null, label: "Nitrates SISE" },
      ]),
    ]);

    expect(snapshots.map((row) => row.measurement.parameterCode)).toEqual([
      "8847",
      "1382",
      "NO3",
      "1340",
    ]);
    expect(snapshots).toHaveLength(4);
  });

  it("keeps PFAS-20 members from the same sample so the sum can be rebuilt", () => {
    const snapshots = extractHistorySnapshots([
      sample("a", "2026-01-01T00:00:00.000Z", [
        { parameterCode: "8847", siseCode: "SPFAS", label: "PFAS-20" },
        { parameterCode: "5347", siseCode: "PFOA", label: "PFOA" },
        { parameterCode: "1339", siseCode: "NO2", label: "Nitrites" },
      ]),
      sample("b", "2026-02-01T00:00:00.000Z", [
        { parameterCode: "1339", siseCode: "NO2", label: "Nitrites" },
      ]),
    ]);

    expect(snapshots.map((row) => row.measurement.parameterCode)).toEqual([
      "8847",
      "5347",
    ]);
  });
});

function sample(
  code: string,
  sampledAt: string,
  measurements: Array<{
    parameterCode: string;
    siseCode: string | null;
    label: string;
  }>,
): AnalysisSample {
  return {
    code,
    udiCode: "033001214",
    sampledAt: new Date(sampledAt),
    conclusion: null,
    conformiteLimitesBact: "C",
    conformiteLimitesPc: "C",
    communeInsee: "33063",
    source: "hubeau",
    measurements: measurements.map((measurement) => ({
      parameterCode: measurement.parameterCode,
      parameterLabel: measurement.label,
      siseCode: measurement.siseCode,
      casCode: null,
      rawText: "1",
      numericValue: 1,
      qualifier: "eq",
      unit: "mg/L",
    })),
  };
}
