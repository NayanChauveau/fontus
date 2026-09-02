import type {
  MeasurementDto,
  NetworkWaterQualityDto,
  ParameterHistoryDto,
} from "../dtos/NetworkWaterQualityDto";

export type AnalysesPort = {
  getByNetworkCode(networkCode: string): Promise<NetworkWaterQualityDto>;
  summarizeHistories(measurements: MeasurementDto[]): ParameterHistoryDto[];
};
