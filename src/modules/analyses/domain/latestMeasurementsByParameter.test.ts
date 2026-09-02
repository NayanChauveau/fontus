import { describe, expect, it } from "vitest";
import {
  latestMeasurementsByParameter,
  latestSample,
  type AnalysisSample,
} from "./Analysis";

describe("latestMeasurementsByParameter", () => {
  it("keeps PFAS from an older campaign when the latest sample has none", () => {
    const routine: AnalysisSample = {
      code: "june",
      udiCode: "033001214",
      sampledAt: new Date("2026-06-18T11:40:00.000Z"),
      conclusion: "Eau d'alimentation conforme.",
      conformiteLimitesBact: "C",
      conformiteLimitesPc: "C",
      communeInsee: "33063",
      source: "hubeau",
      measurements: [
        {
          parameterCode: "1339",
          parameterLabel: "Nitrites (en NO2)",
          rawText: "<0,01",
          numericValue: 0.01,
          qualifier: "lt",
          unit: "mg/L",
        },
      ],
    };
    const pfasCampaign: AnalysisSample = {
      ...routine,
      code: "may",
      sampledAt: new Date("2026-05-18T11:55:00.000Z"),
      measurements: [
        {
          parameterCode: "8847",
          parameterLabel: "Somme de 20 substances perfluoroalkylées (PFAS)",
          rawText: "<0,002",
          numericValue: 0.002,
          qualifier: "lt",
          unit: "µg/L",
        },
        {
          parameterCode: "5347",
          parameterLabel: "Acide perfluoro-octanoïque (PFOA)",
          rawText: "<0,002",
          numericValue: 0.002,
          qualifier: "lt",
          unit: "µg/L",
        },
      ],
    };

    const snapshots = latestMeasurementsByParameter([routine, pfasCampaign]);
    const codes = snapshots.map((row) => row.measurement.parameterCode).sort();

    expect(codes).toEqual(["1339", "5347", "8847"]);
    expect(
      snapshots.find((row) => row.measurement.parameterCode === "8847")
        ?.sampledAt,
    ).toEqual(new Date("2026-05-18T11:55:00.000Z"));
  });

  it("returns null without samples and keeps the later date when reducing", () => {
    expect(latestSample([])).toBeNull();

    const older: AnalysisSample = {
      code: "older",
      udiCode: "033001214",
      sampledAt: new Date("2026-01-01T00:00:00.000Z"),
      conclusion: null,
      conformiteLimitesBact: null,
      conformiteLimitesPc: null,
      communeInsee: null,
      source: "hubeau",
      measurements: [],
    };
    const newer: AnalysisSample = {
      ...older,
      code: "newer",
      sampledAt: new Date("2026-06-01T00:00:00.000Z"),
    };

    expect(latestSample([newer, older])?.code).toBe("newer");
    expect(latestSample([older, newer])?.code).toBe("newer");
  });

  it("keeps the newer value when the same parameter appears again later in the list", () => {
    const newer: AnalysisSample = {
      code: "newer",
      udiCode: "033001214",
      sampledAt: new Date("2026-06-01T00:00:00.000Z"),
      conclusion: null,
      conformiteLimitesBact: null,
      conformiteLimitesPc: null,
      communeInsee: null,
      source: "hubeau",
      measurements: [
        {
          parameterCode: "1339",
          parameterLabel: "Nitrites",
          rawText: "0,02",
          numericValue: 0.02,
          qualifier: "eq",
          unit: "mg/L",
        },
      ],
    };
    const older: AnalysisSample = {
      ...newer,
      code: "older",
      sampledAt: new Date("2026-01-01T00:00:00.000Z"),
      measurements: [
        {
          parameterCode: "1339",
          parameterLabel: "Nitrites",
          rawText: "0,05",
          numericValue: 0.05,
          qualifier: "eq",
          unit: "mg/L",
        },
      ],
    };

    const snapshots = latestMeasurementsByParameter([newer, older]);
    expect(snapshots).toHaveLength(1);
    expect(snapshots[0]?.measurement.numericValue).toBe(0.02);
  });
});
