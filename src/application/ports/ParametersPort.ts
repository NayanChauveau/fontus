import type { MeasurementDto } from "../dtos/NetworkWaterQualityDto";

export type ParametersPort = {
  resolve(measurements: MeasurementDto[]): Promise<MeasurementDto[]>;
};
