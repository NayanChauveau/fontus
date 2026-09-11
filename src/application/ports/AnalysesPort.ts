import type {
  MeasurementDto,
  NetworkWaterQualityDto,
  ParameterHistoryDto,
} from "../dtos/NetworkWaterQualityDto";

export type AnalysesLookupOptions = {
  refresh?: boolean;
};

export type AnalysesPort = {
  getByNetworkCode(
    networkCode: string,
    options?: AnalysesLookupOptions,
  ): Promise<NetworkWaterQualityDto>;
  summarizeHistories(measurements: MeasurementDto[]): ParameterHistoryDto[];
};
