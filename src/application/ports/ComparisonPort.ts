import type { MeasurementDto } from "../dtos/NetworkWaterQualityDto";

export type ComparisonPort = {
  compare(measurements: MeasurementDto[]): Promise<MeasurementDto[]>;
};
