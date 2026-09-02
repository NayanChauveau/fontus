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
    expect(aluminium?.reconstructed).toBe(false);
    expect(viewModel.reconstructedSumNote).toBeNull();
  });

  it("marks a reconstructed PFAS-20 sum", () => {
    const viewModel = mapNetworkWaterQualityDto({
      networkCode: "016000262",
      windowFrom: "2025-09-02",
      source: "cache",
      latestMeasurements: [
        {
          parameterCode: "8847",
          parameterLabel: "Somme de 20 substances perfluoroalkylées (PFAS)",
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
      ],
      latestSample: null,
    });

    const pfas20 = viewModel.priorityMeasurements.find(
      (row) => row.canonicalId === "pfas20",
    );
    expect(pfas20?.valueLabel).toBe("<0,034 µg/L");
    expect(pfas20?.reconstructed).toBe(true);
    expect(viewModel.reconstructedSumNote).toMatch(/<SEUIL/);
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

  it("maps FR/UE comparison statuses and kinds", () => {
    const viewModel = mapNetworkWaterQualityDto({
      networkCode: "033001214",
      windowFrom: "2025-09-02",
      source: "cache",
      latestMeasurements: [
        {
          parameterCode: "1340",
          parameterLabel: "Nitrates",
          rawText: "12,3",
          numericValue: 12.3,
          qualifier: "eq",
          unit: "mg/L",
          sampledAt: "2026-06-18T11:40:00.000Z",
          resolution: {
            canonicalId: "nitrates",
            canonicalName: "Nitrates",
            category: "nutrients",
            displayPriority: 20,
            canonicalUnit: "mg/L",
            canonicalNumericValue: 12.3,
            conversion: "identity",
          },
          comparisons: {
            fr: {
              status: "compliant",
              kind: "legal_limit",
              binding: true,
              thresholdLabel: "≤ 50 mg/L",
              citation: "arrêté",
              sourceUrl: "https://example.test",
            },
            eu: {
              status: "below_loq",
              kind: "quality_reference",
              binding: false,
              thresholdLabel: "≤ 50 mg/L",
              citation: "directive",
              sourceUrl: "https://example.test",
            },
            ch: {
              status: "compliant",
              kind: "legal_limit",
              binding: true,
              thresholdLabel: "≤ 40 mg/L",
              citation: "OPBD",
              sourceUrl: "https://example.test",
            },
            us: {
              status: "compliant",
              kind: "legal_limit",
              binding: true,
              thresholdLabel: "≤ 44,3 mg/L",
              citation: "NPDWR",
              sourceUrl: "https://example.test",
            },
            strict: {
              status: "compliant",
              kind: "site_metric",
              binding: false,
              thresholdLabel: "≤ 40 mg/L",
              citation: "référence stricte",
              sourceUrl: null,
            },
          },
        },
        {
          parameterCode: "5347",
          parameterLabel: "PFOA",
          rawText: "<0,002",
          numericValue: 0.002,
          qualifier: "lt",
          unit: "µg/L",
          sampledAt: "2026-05-18T11:55:00.000Z",
          resolution: {
            canonicalId: "pfoa",
            canonicalName: "PFOA",
            category: "pfas",
            displayPriority: 10,
            canonicalUnit: "µg/L",
            canonicalNumericValue: 0.002,
            conversion: "identity",
          },
          comparisons: {
            fr: {
              status: "no_threshold",
              kind: null,
              binding: false,
              thresholdLabel: null,
              citation: null,
              sourceUrl: null,
            },
            eu: {
              status: "not_comparable",
              kind: null,
              binding: false,
              thresholdLabel: null,
              citation: null,
              sourceUrl: null,
            },
            ch: {
              status: "compliant",
              kind: "legal_limit",
              binding: true,
              thresholdLabel: "< 0,002 / 0,5 µg/L",
              citation: "OPBD",
              sourceUrl: "https://example.test",
            },
            us: {
              status: "compliant",
              kind: "legal_limit",
              binding: true,
              thresholdLabel: "< 0,002 / 0,004 µg/L",
              citation: "NPDWR",
              sourceUrl: "https://example.test",
            },
            strict: {
              status: "compliant",
              kind: "site_metric",
              binding: false,
              thresholdLabel: "< 0,002 / 0,004 µg/L",
              citation: "référence stricte",
              sourceUrl: null,
            },
          },
        },
        {
          parameterCode: "1370",
          parameterLabel: "Aluminium",
          rawText: "300",
          numericValue: 300,
          qualifier: "eq",
          unit: "µg/L",
          sampledAt: "2026-06-18T11:40:00.000Z",
          resolution: {
            canonicalId: "aluminium",
            canonicalName: "Aluminium",
            category: "metals",
            displayPriority: 37,
            canonicalUnit: "µg/L",
            canonicalNumericValue: 300,
            conversion: "identity",
          },
          comparisons: {
            fr: {
              status: "exceedance",
              kind: "quality_reference",
              binding: false,
              thresholdLabel: "≤ 200 µg/L",
              citation: "arrêté",
              sourceUrl: "https://example.test",
            },
            eu: null,
            ch: {
              status: "exceedance",
              kind: "legal_limit",
              binding: true,
              thresholdLabel: "≤ 200 µg/L",
              citation: "OPBD",
              sourceUrl: "https://example.test",
            },
            us: null,
            strict: {
              status: "exceedance",
              kind: "site_metric",
              binding: false,
              thresholdLabel: "≤ 200 µg/L",
              citation: "référence stricte",
              sourceUrl: null,
            },
          },
        },
      ],
      latestSample: null,
    });

    const nitrates = viewModel.priorityMeasurements.find(
      (row) => row.canonicalId === "nitrates",
    );
    const pfoa = viewModel.priorityMeasurements.find(
      (row) => row.canonicalId === "pfoa",
    );
    const aluminium = viewModel.priorityMeasurements.find(
      (row) => row.canonicalId === "aluminium",
    );

    expect(nitrates?.fr?.statusLabel).toBe("conforme");
    expect(nitrates?.fr?.kindLabel).toBe("limite légale");
    expect(nitrates?.eu?.statusLabel).toBe("LQ > seuil");
    expect(nitrates?.eu?.kindLabel).toBe("référence de qualité");
    expect(nitrates?.ch?.statusLabel).toBe("conforme");
    expect(nitrates?.strict?.kindLabel).toBe("référence stricte (site)");
    expect(nitrates?.strict?.siteMetric).toBe(true);
    expect(pfoa?.fr?.statusLabel).toBe("pas de seuil");
    expect(pfoa?.eu?.statusLabel).toBe("non comparable");
    expect(pfoa?.us?.thresholdLabel).toBe("< 0,002 / 0,004 µg/L");
    expect(aluminium?.fr?.statusLabel).toBe("dépassement");
    expect(aluminium?.eu).toBeNull();
  });
});

