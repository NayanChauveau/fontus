import { describe, expect, it } from "vitest";
import { toPublicQualityDto } from "./toPublicQualityDto";

describe("toPublicQualityDto", () => {
  it("strips raw history and sample measurements from the HTTP payload", () => {
    const publicDto = toPublicQualityDto({
      networkCode: "033001214",
      windowFrom: "2025-09-02",
      source: "cache",
      latestSample: {
        code: "s1",
        sampledAt: "2026-06-18T11:40:00.000Z",
        conclusion: "conforme",
        conformiteLimitesBact: "C",
        conformiteLimitesPc: "C",
        source: "hubeau",
        measurements: [
          {
            parameterCode: "1340",
            parameterLabel: "Nitrates",
            rawText: "8",
            numericValue: 8,
            qualifier: "eq",
            unit: "mg/L",
            resolution: null,
          },
        ],
      },
      latestMeasurements: [],
      historyMeasurements: [
        {
          parameterCode: "1340",
          parameterLabel: "Nitrates",
          rawText: "8",
          numericValue: 8,
          qualifier: "eq",
          unit: "mg/L",
          resolution: null,
        },
      ],
      parameterHistories: [],
    });

    expect(publicDto.historyMeasurements).toBeUndefined();
    expect(publicDto.latestSample?.measurements).toEqual([]);
    expect(publicDto.latestSample?.conclusion).toBe("conforme");
  });
});
