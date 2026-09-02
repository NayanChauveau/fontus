import { describe, expect, it } from "vitest";
import { ApplicationError } from "@/application/errors/ApplicationError";
import { createAnalysesPortAdapter } from "./createAnalysesPortAdapter";

const sample = {
  code: "s1",
  udiCode: "033001214",
  sampledAt: new Date("2026-06-18T11:40:00.000Z"),
  conclusion: "conforme",
  conformiteLimitesBact: "C",
  conformiteLimitesPc: "C",
  communeInsee: "33063",
  source: "hubeau",
  measurements: [
    {
      parameterCode: "1339",
      parameterLabel: "Nitrites",
      siseCode: "NO2",
      casCode: null,
      rawText: "<0,01",
      numericValue: 0.01,
      qualifier: "lt" as const,
      unit: "mg/L",
    },
  ],
};

describe("createAnalysesPortAdapter", () => {
  it("maps the latest sample and per-parameter snapshots", async () => {
    const adapter = createAnalysesPortAdapter({
      getNetworkAnalyses: {
        async execute() {
          return {
            networkCode: "033001214",
            windowFrom: "2025-09-02",
            source: "cache",
            latestSample: sample,
            latestMeasurements: [
              { sampledAt: sample.sampledAt, measurement: sample.measurements[0]! },
            ],
            historySnapshots: [],
          };
        },
      } as never,
    });

    const dto = await adapter.getByNetworkCode("033001214");
    expect(dto.latestSample?.measurements[0]?.rawText).toBe("<0,01");
    expect(dto.latestMeasurements[0]?.sampledAt).toBe(
      "2026-06-18T11:40:00.000Z",
    );
    expect(dto.historyMeasurements).toEqual([]);
    expect(dto.parameterHistories).toEqual([]);
  });

  it("returns a null sample when the module has none", async () => {
    const adapter = createAnalysesPortAdapter({
      getNetworkAnalyses: {
        async execute() {
          return {
            networkCode: "033001214",
            windowFrom: "2025-09-02",
            source: "cache",
            latestSample: null,
            latestMeasurements: [],
            historySnapshots: [],
          };
        },
      } as never,
    });

    expect((await adapter.getByNetworkCode("033001214")).latestSample).toBeNull();
  });

  it("wraps module failures", async () => {
    const adapter = createAnalysesPortAdapter({
      getNetworkAnalyses: {
        async execute() {
          throw new Error("down");
        },
      } as never,
    });

    await expect(adapter.getByNetworkCode("033001214")).rejects.toBeInstanceOf(
      ApplicationError,
    );
  });
});
