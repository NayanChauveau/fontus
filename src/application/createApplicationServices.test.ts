import { describe, expect, it } from "vitest";
import { createApplicationServices } from "./createApplicationServices";
import { createFakeApplicationPorts } from "./ports/testing/createFakeApplicationPorts";

describe("createApplicationServices", () => {
  it("wires every use case", () => {
    const { ports } = createFakeApplicationPorts();
    const application = createApplicationServices(ports);
    expect(application.healthCheckUseCase).toBeDefined();
    expect(application.getNetworkWaterQualityUseCase).toBeDefined();
    expect(application.listDistributionNetworksUseCase).toBeDefined();
    expect(application.resolveAddressUseCase).toBeDefined();
    expect(application.suggestAddressesUseCase).toBeDefined();
  });
});
