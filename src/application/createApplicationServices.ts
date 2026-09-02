import type { ApplicationPorts } from "./ports/ApplicationPorts";
import { HealthCheckUseCase } from "./use-cases/HealthCheckUseCase";

export function createApplicationServices(ports: ApplicationPorts) {
  return {
    healthCheckUseCase: new HealthCheckUseCase(ports),
  };
}

export type ApplicationServices = ReturnType<typeof createApplicationServices>;
