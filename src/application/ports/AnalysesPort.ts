import type { NetworkWaterQualityDto } from "../dtos/NetworkWaterQualityDto";

export type AnalysesPort = {
  getByNetworkCode(networkCode: string): Promise<NetworkWaterQualityDto>;
};
