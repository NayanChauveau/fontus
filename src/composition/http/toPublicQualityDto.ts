import type { NetworkWaterQualityDto } from "@/application/dtos/NetworkWaterQualityDto";

export function toPublicQualityDto(
  dto: NetworkWaterQualityDto,
): NetworkWaterQualityDto {
  return {
    networkCode: dto.networkCode,
    windowFrom: dto.windowFrom,
    source: dto.source,
    latestSample: dto.latestSample
      ? { ...dto.latestSample, measurements: [] }
      : null,
    latestMeasurements: dto.latestMeasurements,
    parameterHistories: dto.parameterHistories ?? [],
    comparisonFailed: dto.comparisonFailed,
  };
}
