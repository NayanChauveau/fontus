import type { NetworkWaterQualityDto } from "../dtos/NetworkWaterQualityDto";
import { isNetworkCode, normalizeNetworkCode } from "../networkCode";
import type { ApplicationPorts } from "../ports/ApplicationPorts";

export class GetNetworkWaterQualityUseCase {
  constructor(private readonly ports: ApplicationPorts) {}

  async execute(networkCode: string): Promise<NetworkWaterQualityDto> {
    if (!isNetworkCode(networkCode)) {
      return {
        networkCode: "",
        windowFrom: "",
        source: "cache",
        latestSample: null,
        latestMeasurements: [],
        parameterHistories: [],
      };
    }

    const dto = await this.ports.analyses.getByNetworkCode(
      normalizeNetworkCode(networkCode),
    );
    const historyMeasurements = dto.historyMeasurements ?? [];

    try {
      const resolved = await this.ports.parameters.resolve(
        dto.latestMeasurements,
      );
      try {
        return await this.withHistories(
          {
            ...dto,
            latestMeasurements: await this.ports.comparison.compare(resolved),
            parameterHistories: [],
          },
          historyMeasurements,
        );
      } catch (error) {
        this.ports.observability.report({
          level: "error",
          scope: "comparison",
          event: "compare_failed",
          cause: error,
          context: { networkCode: dto.networkCode },
        });
        return this.withHistories(
          {
            ...dto,
            latestMeasurements: resolved,
            parameterHistories: [],
            comparisonFailed: true,
          },
          historyMeasurements,
        );
      }
    } catch (error) {
      this.ports.observability.report({
        level: "error",
        scope: "parameters",
        event: "resolve_failed",
        cause: error,
        context: { networkCode: dto.networkCode },
      });
      return { ...dto, parameterHistories: dto.parameterHistories ?? [] };
    }
  }

  private async withHistories(
    dto: NetworkWaterQualityDto,
    historyMeasurements: NetworkWaterQualityDto["latestMeasurements"],
  ): Promise<NetworkWaterQualityDto> {
    if (historyMeasurements.length === 0) {
      return { ...dto, parameterHistories: [] };
    }

    try {
      const resolved = await this.ports.parameters.resolve(historyMeasurements);
      try {
        const compared = await this.ports.comparison.compare(resolved);
        return {
          ...dto,
          parameterHistories: this.ports.analyses.summarizeHistories(compared),
        };
      } catch (error) {
        this.ports.observability.report({
          level: "error",
          scope: "comparison",
          event: "history_compare_failed",
          cause: error,
          context: { networkCode: dto.networkCode },
        });
        return {
          ...dto,
          parameterHistories: this.ports.analyses.summarizeHistories(resolved),
        };
      }
    } catch (error) {
      this.ports.observability.report({
        level: "error",
        scope: "parameters",
        event: "history_resolve_failed",
        cause: error,
        context: { networkCode: dto.networkCode },
      });
      return { ...dto, parameterHistories: [] };
    }
  }
}
