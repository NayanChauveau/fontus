import type { HealthDto } from "../dtos/HealthDto";
import type { ApplicationPorts } from "../ports/ApplicationPorts";

export class HealthCheckUseCase {
  constructor(private readonly ports: ApplicationPorts) {}

  async execute(): Promise<HealthDto> {
    try {
      const ping = await this.ports.health.ping();
      return {
        status: ping.ok ? "ok" : "error",
        postgres: ping.ok,
        checkedAt: ping.at.toISOString(),
      };
    } catch {
      return {
        status: "error",
        postgres: false,
        checkedAt: new Date().toISOString(),
      };
    }
  }
}
