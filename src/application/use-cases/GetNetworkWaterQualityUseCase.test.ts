import { describe, expect, it } from "vitest";
import { ApplicationError } from "../errors/ApplicationError";
import { createFakeApplicationPorts } from "../ports/testing/createFakeApplicationPorts";
import { GetNetworkWaterQualityUseCase } from "./GetNetworkWaterQualityUseCase";

const paulin: Awaited<
  ReturnType<GetNetworkWaterQualityUseCase["execute"]>
> = {
  networkCode: "033001214",
  windowFrom: "2025-09-02",
  source: "remote",
  latestMeasurements: [
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
    measurements: [
      {
        parameterCode: "1339",
        parameterLabel: "Nitrites (en NO2)",
        rawText: "<0,01",
        numericValue: 0.01,
        qualifier: "lt",
        unit: "mg/L",
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
  },
};

describe("GetNetworkWaterQualityUseCase", () => {
  it("returns empty without calling the port when the network code is invalid", async () => {
    let called = false;
    const { ports } = createFakeApplicationPorts({
      analyses: {
        async getByNetworkCode() {
          called = true;
          return paulin;
        },
      },
    });

    const result = await new GetNetworkWaterQualityUseCase(ports).execute(
      "paulin",
    );

    expect(result.latestSample).toBeNull();
    expect(called).toBe(false);
  });

  it("resolves measurements through the parameter dictionary", async () => {
    const { ports } = createFakeApplicationPorts({
      analyses: {
        async getByNetworkCode(networkCode) {
          expect(networkCode).toBe("033001214");
          return {
            ...paulin,
            latestMeasurements: paulin.latestMeasurements.map(
              (measurement) => ({ ...measurement, resolution: null }),
            ),
          };
        },
      },
      parameters: {
        async resolve(measurements) {
          return measurements.map((measurement) => ({
            ...measurement,
            resolution: paulin.latestMeasurements[0]?.resolution ?? null,
          }));
        },
      },
    });

    const result = await new GetNetworkWaterQualityUseCase(ports).execute(
      "033001214",
    );

    expect(result.latestMeasurements[0]?.resolution?.canonicalId).toBe(
      "nitrites",
    );
    expect(result.latestMeasurements[0]?.rawText).toBe("<0,01");
  });

  it("returns raw analyses when the dictionary fails", async () => {
    const reported: string[] = [];
    const { ports } = createFakeApplicationPorts({
      analyses: {
        async getByNetworkCode() {
          return {
            ...paulin,
            latestMeasurements: paulin.latestMeasurements.map(
              (measurement) => ({ ...measurement, resolution: null }),
            ),
          };
        },
      },
      parameters: {
        async resolve() {
          throw new Error("dictionary down");
        },
      },
      observability: {
        report(event) {
          reported.push(event.event);
        },
      },
    });

    const result = await new GetNetworkWaterQualityUseCase(ports).execute(
      "033001214",
    );
    expect(result.latestMeasurements[0]?.resolution).toBeNull();
    expect(reported).toEqual(["resolve_failed"]);
  });

  it("keeps resolved measurements when comparison fails", async () => {
    const reported: string[] = [];
    const { ports } = createFakeApplicationPorts({
      analyses: {
        async getByNetworkCode() {
          return {
            ...paulin,
            latestMeasurements: paulin.latestMeasurements.map(
              (measurement) => ({ ...measurement, resolution: null }),
            ),
          };
        },
      },
      parameters: {
        async resolve(measurements) {
          return measurements.map((measurement) => ({
            ...measurement,
            resolution: paulin.latestMeasurements[0]?.resolution ?? null,
          }));
        },
      },
      comparison: {
        async compare() {
          throw new Error("norms down");
        },
      },
      observability: {
        report(event) {
          reported.push(event.event);
        },
      },
    });

    const result = await new GetNetworkWaterQualityUseCase(ports).execute(
      "033001214",
    );
    expect(result.latestMeasurements[0]?.resolution?.canonicalId).toBe(
      "nitrites",
    );
    expect(result.latestMeasurements[0]?.comparisons).toBeUndefined();
    expect(reported).toEqual(["compare_failed"]);
  });

  it("attaches comparisons after resolving", async () => {
    const { ports } = createFakeApplicationPorts({
      analyses: {
        async getByNetworkCode() {
          return paulin;
        },
      },
      comparison: {
        async compare(measurements) {
          return measurements.map((measurement) => ({
            ...measurement,
            comparisons: {
              fr: {
                status: "compliant",
                kind: "legal_limit",
                binding: true,
                thresholdLabel: "≤ 0,5 mg/L",
                citation: "arrêté",
                sourceUrl: "https://example.test",
              },
              eu: {
                status: "compliant",
                kind: "legal_limit",
                binding: true,
                thresholdLabel: "≤ 0,5 mg/L",
                citation: "directive",
                sourceUrl: "https://example.test",
              },
              ch: {
                status: "compliant",
                kind: "legal_limit",
                binding: true,
                thresholdLabel: "≤ 0,1 mg/L",
                citation: "OPBD",
                sourceUrl: "https://example.test",
              },
              us: {
                status: "compliant",
                kind: "legal_limit",
                binding: true,
                thresholdLabel: "≤ 3,28 mg/L",
                citation: "NPDWR",
                sourceUrl: "https://example.test",
              },
              strict: {
                status: "compliant",
                kind: "site_metric",
                binding: false,
                thresholdLabel: "≤ 0,1 mg/L",
                citation: "référence stricte",
                sourceUrl: null,
              },
            },
          }));
        },
      },
    });

    const result = await new GetNetworkWaterQualityUseCase(ports).execute(
      "033001214",
    );
    expect(result.latestMeasurements[0]?.comparisons?.fr?.status).toBe(
      "compliant",
    );
  });

  it("propagates ANALYSES_UNAVAILABLE", async () => {
    const { ports } = createFakeApplicationPorts({
      analyses: {
        async getByNetworkCode() {
          throw new ApplicationError("ANALYSES_UNAVAILABLE");
        },
      },
    });

    await expect(
      new GetNetworkWaterQualityUseCase(ports).execute("033001214"),
    ).rejects.toMatchObject({ code: "ANALYSES_UNAVAILABLE" });
  });
});
