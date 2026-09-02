import { describe, expect, it } from "vitest";
import { buildParameterHistories } from "./buildParameterHistories";
import type { MeasurementDto } from "@/application/dtos/NetworkWaterQualityDto";

describe("buildParameterHistories", () => {
  it("groups resolved nitrates and ignores other parameters", () => {
    const histories = buildParameterHistories([
      point("1340", "nitrates", "Nitrates", "2026-06-01T00:00:00.000Z", 12),
      point("1339", "nitrites", "Nitrites", "2026-06-01T00:00:00.000Z", 0.01),
      point("1340", "nitrates", "Nitrates", "2026-01-01T00:00:00.000Z", 8),
      point("1340", "nitrates", "Nitrates", "2026-03-01T00:00:00.000Z", 10),
    ]);

    expect(histories).toHaveLength(1);
    expect(histories[0]?.canonicalId).toBe("nitrates");
    expect(histories[0]?.points).toHaveLength(3);
    expect(histories[0]?.points[0]?.sampledAt).toBe("2026-01-01T00:00:00.000Z");
    expect(histories[0]?.min).toBe(8);
    expect(histories[0]?.max).toBe(12);
    expect(histories[0]?.trend).toBe("rising");
  });

  it("falls back to the raw value, sorts missing dates first and flags an LQ change", () => {
    const histories = buildParameterHistories([
      {
        parameterCode: "1382",
        parameterLabel: "Plomb",
        rawText: "<0,5",
        numericValue: 0.5,
        qualifier: "lt",
        unit: "µg/L",
        resolution: {
          canonicalId: "lead",
          canonicalName: "",
          category: "metals",
          displayPriority: 30,
          canonicalUnit: "",
          canonicalNumericValue: null,
          conversion: "identity",
        },
      },
      {
        parameterCode: "1382",
        parameterLabel: "Plomb",
        rawText: "0,5",
        numericValue: 0.5,
        qualifier: "eq",
        unit: "µg/L",
        sampledAt: "2026-06-01T00:00:00.000Z",
        resolution: {
          canonicalId: "lead",
          canonicalName: "Plomb",
          category: "metals",
          displayPriority: 30,
          canonicalUnit: "µg/L",
          canonicalNumericValue: 0.5,
          conversion: "identity",
        },
      },
    ]);

    expect(histories[0]?.canonicalId).toBe("lead");
    expect(histories[0]?.canonicalName).toBe("Plomb");
    expect(histories[0]?.warnings).toEqual(["loq_changed"]);
    expect(histories[0]?.points[0]?.sampledAt).toBeUndefined();
    expect(histories[0]?.count).toBe(1);
  });

  it("keeps a reconstructed PFAS-20 series without treating < LQ as exact", () => {
    const histories = buildParameterHistories([
      {
        parameterCode: "8847",
        parameterLabel: "Somme PFAS-20",
        rawText: "<0,034",
        numericValue: 0.034,
        qualifier: "lt",
        unit: "µg/L",
        sampledAt: "2026-06-30T11:59:00.000Z",
        resolution: {
          canonicalId: "pfas20",
          canonicalName: "Somme PFAS-20",
          category: "pfas",
          displayPriority: 12,
          canonicalUnit: "µg/L",
          canonicalNumericValue: 0.034,
          conversion: "identity",
          derived: "reconstructed_sum",
        },
      },
      {
        parameterCode: "5347",
        parameterLabel: "PFOA",
        rawText: "<0,001",
        numericValue: 0.001,
        qualifier: "lt",
        unit: "µg/L",
        sampledAt: "2026-06-30T11:59:00.000Z",
        resolution: {
          canonicalId: "pfoa",
          canonicalName: "PFOA",
          category: "pfas",
          displayPriority: 10,
          canonicalUnit: "µg/L",
          canonicalNumericValue: 0.001,
          conversion: "identity",
        },
      },
    ]);

    expect(histories).toHaveLength(1);
    expect(histories[0]?.canonicalId).toBe("pfas20");
    expect(histories[0]?.min).toBeNull();
    expect(histories[0]?.count).toBe(0);
  });

  it("skips unresolved rows", () => {
    expect(
      buildParameterHistories([
        {
          parameterCode: "1340",
          parameterLabel: "Nitrates",
          rawText: "8",
          numericValue: 8,
          qualifier: "eq",
          unit: "mg/L",
          sampledAt: "2026-01-01T00:00:00.000Z",
          resolution: null,
        },
      ]),
    ).toEqual([]);
  });
});

function point(
  parameterCode: string,
  canonicalId: string,
  canonicalName: string,
  sampledAt: string,
  value: number,
): MeasurementDto {
  return {
    parameterCode,
    parameterLabel: canonicalName,
    rawText: String(value),
    numericValue: value,
    qualifier: "eq",
    unit: "mg/L",
    sampledAt,
    resolution: {
      canonicalId,
      canonicalName,
      category: "nutrients",
      displayPriority: 20,
      canonicalUnit: "mg/L",
      canonicalNumericValue: value,
      conversion: "identity",
    },
  };
}
