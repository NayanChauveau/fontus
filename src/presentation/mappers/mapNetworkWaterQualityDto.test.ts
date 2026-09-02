import { describe, expect, it } from "vitest";
import { mapNetworkWaterQualityDto } from "./mapNetworkWaterQualityDto";

describe("mapNetworkWaterQualityDto", () => {
  it("shows < LQ as-is with the unit and keeps the official ARS conclusion", () => {
    const viewModel = mapNetworkWaterQualityDto({
      networkCode: "033001214",
      windowFrom: "2025-09-02",
      source: "cache",
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
          },
        ],
      },
    });

    expect(viewModel.conclusion).toBe("Eau d'alimentation conforme.");
    expect(viewModel.measurements[0]?.valueLabel).toBe("<0,01 mg/L");
  });
});
