import { describe, expect, it } from "vitest";
import { ApplicationError } from "@/application/errors/ApplicationError";
import { createComparisonPortAdapter } from "./createComparisonPortAdapter";

describe("createComparisonPortAdapter", () => {
  it("maps comparisons onto the measurement DTO", async () => {
    const adapter = createComparisonPortAdapter({
      compareMeasurements: {
        async execute(measurements: Array<{ parameterCode: string }>) {
          return measurements.map((measurement) => ({
            ...measurement,
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
                status: "compliant",
                kind: "legal_limit",
                binding: true,
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
          }));
        },
      } as never,
    });

    const result = await adapter.compare([
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
      },
    ]);

    expect(result[0]?.comparisons?.fr?.status).toBe("compliant");
  });

  it("falls back to the raw numeric value when resolution is missing", async () => {
    const adapter = createComparisonPortAdapter({
      compareMeasurements: {
        async execute(
          measurements: Array<{
            parameterId: string | null;
            canonicalUnit?: string | null;
          }>,
        ) {
          expect(measurements[0]?.parameterId).toBeNull();
          expect(measurements[0]?.canonicalUnit).toBe("mg/L");
          return measurements.map((measurement) => ({
            ...measurement,
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
                status: "no_threshold",
                kind: null,
                binding: false,
                thresholdLabel: null,
                citation: null,
                sourceUrl: null,
              },
              ch: {
                status: "no_threshold",
                kind: null,
                binding: false,
                thresholdLabel: null,
                citation: null,
                sourceUrl: null,
              },
              us: {
                status: "no_threshold",
                kind: null,
                binding: false,
                thresholdLabel: null,
                citation: null,
                sourceUrl: null,
              },
              strict: {
                status: "no_threshold",
                kind: null,
                binding: false,
                thresholdLabel: null,
                citation: null,
                sourceUrl: null,
              },
            },
          }));
        },
      } as never,
    });

    const result = await adapter.compare([
      {
        parameterCode: "x",
        parameterLabel: "X",
        rawText: "1",
        numericValue: 1,
        qualifier: "eq",
        unit: "mg/L",
        resolution: null,
      },
    ]);
    expect(result[0]?.comparisons?.fr?.status).toBe("no_threshold");
  });

  it("wraps module failures", async () => {
    const adapter = createComparisonPortAdapter({
      compareMeasurements: {
        async execute() {
          throw new Error("down");
        },
      } as never,
    });

    await expect(adapter.compare([])).rejects.toBeInstanceOf(ApplicationError);
  });
});
