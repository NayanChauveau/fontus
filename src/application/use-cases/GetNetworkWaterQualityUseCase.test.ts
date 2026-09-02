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

  it("delegates a valid UDI code", async () => {
    const { ports } = createFakeApplicationPorts({
      analyses: {
        async getByNetworkCode(networkCode) {
          expect(networkCode).toBe("033001214");
          return paulin;
        },
      },
    });

    const result = await new GetNetworkWaterQualityUseCase(ports).execute(
      "033001214",
    );

    expect(result).toEqual(paulin);
    expect(result.latestSample?.measurements[0]?.rawText).toBe("<0,01");
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
