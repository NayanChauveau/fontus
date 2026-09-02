import { describe, expect, it } from "vitest";
import { createApplicationServices } from "./createApplicationServices";
import { createFakeApplicationPorts } from "./ports/testing/createFakeApplicationPorts";

describe("createApplicationServices", () => {
  it("wires every use case and reports errors through observability", () => {
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
