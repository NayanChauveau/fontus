import { describe, expect, it } from "vitest";
import { createApplicationServices } from "./createApplicationServices";
import { createFakeApplicationPorts } from "./ports/testing/createFakeApplicationPorts";

describe("createApplicationServices", () => {
  it("wires every use case and reports errors through observability", async () => {
    const reported: unknown[] = [];
    const { ports } = createFakeApplicationPorts({
      observability: {
        report(event) {
          reported.push(event);
        },
      },
    });
    const application = createApplicationServices(ports);
    expect(application.healthCheckUseCase).toBeDefined();
    expect(application.getNetworkWaterQualityUseCase).toBeDefined();
    expect(application.listDistributionNetworksUseCase).toBeDefined();
    expect(application.resolveAddressUseCase).toBeDefined();
    expect(application.suggestAddressesUseCase).toBeDefined();
    await expect(
      application.consumeRateLimit({ key: "quality:1", limit: 1, windowMs: 1 }),
    ).resolves.toBe(true);

    application.reportError({
      scope: "analyses",
      event: "quality_unavailable",
      code: "ANALYSES_UNAVAILABLE",
    });
    expect(reported).toEqual([
      {
        level: "error",
        scope: "analyses",
        event: "quality_unavailable",
        code: "ANALYSES_UNAVAILABLE",
      },
    ]);
  });
});
