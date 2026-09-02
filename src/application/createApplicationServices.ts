import type { ApplicationPorts } from "./ports/ApplicationPorts";
import { HealthCheckUseCase } from "./use-cases/HealthCheckUseCase";
import { ResolveAddressUseCase } from "./use-cases/ResolveAddressUseCase";
import { SuggestAddressesUseCase } from "./use-cases/SuggestAddressesUseCase";

export function createApplicationServices(ports: ApplicationPorts) {
  return {
    healthCheckUseCase: new HealthCheckUseCase(ports),
    resolveAddressUseCase: new ResolveAddressUseCase(ports),
    suggestAddressesUseCase: new SuggestAddressesUseCase(ports),
  };
}

export type ApplicationServices = ReturnType<typeof createApplicationServices>;
