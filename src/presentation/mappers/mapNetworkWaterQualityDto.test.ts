import { describe, expect, it } from "vitest";
import { mapNetworkWaterQualityDto } from "./mapNetworkWaterQualityDto";

describe("mapNetworkWaterQualityDto", () => {
  it("shows < LQ as-is and a converted canonical value", () => {
    const viewModel = mapNetworkWaterQualityDto({
      networkCode: "033001214",
      windowFrom: "2025-09-02",
      source: "cache",
      latestMeasurements: [
        {
          parameterCode: "1370",
          parameterLabel: "Aluminium total µg/l",
          rawText: "0,005",
          numericValue: 0.005,
          qualifier: "eq",
          unit: "mg/L",
          sampledAt: "2026-06-18T11:40:00.000Z",
          resolution: {
            canonicalId: "aluminium",
            canonicalName: "Aluminium",
            category: "metals",
            displayPriority: 37,
            canonicalUnit: "µg/L",
            canonicalNumericValue: 5,
            conversion: "converted",
          },
        },
        {
          parameterCode: "1339",
          parameterLabel: "Nitrites (en NO2)",
          rawText: "<0,01",
          numericValue: 0.01,
          qualifier: "lt",
          unit: "mg/L",
          sampledAt: "2026-06-18T11:40:00.000Z",
          resolution: {
            canonicalId: "nitrites",
            canonicalName: "Nitrites",
            category: "nutrients",
            displayPriority: 21,
            canonicalUnit: "mg/L",
            canonicalNumericValue: 0.01,
            conversion: "identity",
          },
        },
      ],
      latestSample: {
        code: "03300277847",
        sampledAt: "2026-06-18T11:40:00.000Z",
        conclusion: "Eau d'alimentation conforme.",
        conformiteLimitesBact: "C",
        conformiteLimitesPc: "C",
        source: "hubeau",
        measurements: [],
      },
    });

    expect(viewModel.conclusion).toBe("Eau d'alimentation conforme.");
    const aluminium = viewModel.priorityMeasurements.find(
      (row) => row.canonicalId === "aluminium",
    );
    const nitrites = viewModel.priorityMeasurements.find(
      (row) => row.canonicalId === "nitrites",
    );
    expect(aluminium?.valueLabel).toBe("0,005 mg/L");
    expect(aluminium?.canonicalValueLabel).toBe("5 µg/L");
    expect(aluminium?.parameterLabel).toBe("Aluminium");
    expect(aluminium?.originalLabel).toBe("Aluminium total µg/l");
    expect(nitrites?.valueLabel).toBe("<0,01 mg/L");
    expect(nitrites?.canonicalValueLabel).toBe("< 0,01 mg/L");
  });

  it("hides a canonical value that cannot be converted and keeps a raw date", () => {
    const viewModel = mapNetworkWaterQualityDto({
      networkCode: "033001214",
      windowFrom: "2025-09-02",
      source: "remote",
      latestMeasurements: [
        {
          parameterCode: "1",
          parameterLabel: "Aspect",
          rawText: "normal",
          numericValue: null,
          qualifier: "gt",
          unit: null,
          sampledAt: "not-a-date",
          resolution: {
            canonicalId: "unlisted:1",
            canonicalName: "Aspect",
            category: "unlisted",
            displayPriority: 1000,
            canonicalUnit: null,
            canonicalNumericValue: null,
            conversion: "not_numeric",
          },
        },
        {
          parameterCode: "2",
          parameterLabel: "X",
          rawText: "1",
          numericValue: 1,
          qualifier: "eq",
          unit: "NFU",
          resolution: null,
        },
      ],
      latestSample: {
        code: "s",
        sampledAt: "not-a-date",
        conclusion: null,
        conformiteLimitesBact: null,
        conformiteLimitesPc: null,
        source: "other",
        measurements: [],
      },
    });

    expect(viewModel.priorityMeasurements).toEqual([]);
    expect(viewModel.otherMeasurements[0]?.canonicalValueLabel).toBeNull();
    expect(viewModel.otherMeasurements[0]?.sampledAtLabel).toBe("not-a-date");
  });

  it("falls back when there is no latest sample and no per-parameter date", () => {
    const viewModel = mapNetworkWaterQualityDto({
      networkCode: "033001214",
      windowFrom: "2025-09-02",
      source: "remote",
      latestMeasurements: [
        {
          parameterCode: "1",
          parameterLabel: "Aspect",
          rawText: "normal",
          numericValue: null,
          qualifier: "eq",
          unit: null,
          resolution: {
            canonicalId: "unlisted:1",
            canonicalName: "Aspect",
            category: "unlisted",
            displayPriority: 1000,
            canonicalUnit: null,
            canonicalNumericValue: 1,
            conversion: "not_convertible",
          },
        },
      ],
      latestSample: null,
    });

    expect(viewModel.sampledAtLabel).toBeNull();
    expect(viewModel.otherMeasurements[0]?.sampledAtLabel).toBe("");
    expect(viewModel.otherMeasurements[0]?.canonicalValueLabel).toBeNull();
  });
});

