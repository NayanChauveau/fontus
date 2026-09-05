import type { HealthDto } from "../dtos/HealthDto";
import type { ApplicationPorts } from "../ports/ApplicationPorts";

export class HealthCheckUseCase {
  constructor(private readonly ports: ApplicationPorts) {}

  async execute(): Promise<HealthDto> {
    try {
      const ping = await this.ports.health.ping();
      if (!ping.ok) {
        this.ports.observability.report({
          level: "error",
          scope: "health",
          event: ping.postgres ? "schema_missing" : "postgres_unhealthy",
          code: ping.postgres ? "schema_missing" : "postgres_unhealthy",
          context: {
            postgres: ping.postgres,
            schema: ping.schema,
            detail: ping.detail,
          },
        });
      }
      return {
        status: ping.ok ? "ok" : "error",
        postgres: ping.postgres,
        schema: ping.schema,
        detail: ping.detail,
        checkedAt: ping.at.toISOString(),
      };
    } catch (error) {
      this.ports.observability.report({
        level: "error",
        scope: "health",
        event: "postgres_unreachable",
        cause: error,
      });
      return {
        status: "error",
        postgres: false,
        schema: false,
        detail:
          error instanceof Error ? error.message : "Postgres did not answer.",
        checkedAt: new Date().toISOString(),
      };
    }
  }
}