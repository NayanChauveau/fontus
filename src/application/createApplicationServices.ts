import type { ApplicationPorts } from "./ports/ApplicationPorts";
import type { ObservabilityEvent } from "./ports/ObservabilityPort";
import { GetNetworkWaterQualityUseCase } from "./use-cases/GetNetworkWaterQualityUseCase";
import { HealthCheckUseCase } from "./use-cases/HealthCheckUseCase";
import { ListDistributionNetworksUseCase } from "./use-cases/ListDistributionNetworksUseCase";
import { ResolveAddressUseCase } from "./use-cases/ResolveAddressUseCase";
import { SuggestAddressesUseCase } from "./use-cases/SuggestAddressesUseCase";

export function createApplicationServices(ports: ApplicationPorts) {
  return {
    getNetworkWaterQualityUseCase: new GetNetworkWaterQualityUseCase(ports),
    healthCheckUseCase: new HealthCheckUseCase(ports),
    listDistributionNetworksUseCase: new ListDistributionNetworksUseCase(ports),
    resolveAddressUseCase: new ResolveAddressUseCase(ports),
    suggestAddressesUseCase: new SuggestAddressesUseCase(ports),
    consumeRateLimit(input: {
      key: string;
      limit: number;
      windowMs: number;
    }) {
      return ports.rateLimit.consume(input);
    },
    reportError(event: Omit<ObservabilityEvent, "level">) {
      ports.observability.report({ ...event, level: "error" });
    },
  };
}

export type ApplicationServices = ReturnType<typeof createApplicationServices>;
