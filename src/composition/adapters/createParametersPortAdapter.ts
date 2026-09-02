import { ApplicationError } from "@/application/errors/ApplicationError";
import type { MeasurementDto } from "@/application/dtos/NetworkWaterQualityDto";
import type { ParametersPort } from "@/application/ports/ParametersPort";
import type { ParametersModuleFacade } from "@/modules/parameters";

export function createParametersPortAdapter(
  module: ParametersModuleFacade,
): ParametersPort {
  return {
    async resolve(measurements) {
      try {
        const resolved = await module.resolveMeasurements.execute(measurements);
        return resolved.map(
          (measurement): MeasurementDto => ({
            parameterCode: measurement.parameterCode,
            parameterLabel: measurement.parameterLabel,
            siseCode: measurement.siseCode,
            casCode: measurement.casCode,
            rawText: measurement.rawText,
            numericValue: measurement.numericValue,
            qualifier: measurement.qualifier,
            unit: measurement.unit,
            sampledAt: measurement.sampledAt,
            resolution: measurement.resolution,
          }),
        );
      } catch (error) {
        throw new ApplicationError("PARAMETERS_UNAVAILABLE", error);
      }
    },
  };
}
