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
      };
    }

    const dto = await this.ports.analyses.getByNetworkCode(
      normalizeNetworkCode(networkCode),
    );

    try {
      return {
        ...dto,
        latestMeasurements: await this.ports.parameters.resolve(
          dto.latestMeasurements,
        ),
      };
    } catch {
      return dto;
    }
  }
}
