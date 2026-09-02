import { ApplicationError } from "@/application/errors/ApplicationError";
import type { MeasurementDto } from "@/application/dtos/NetworkWaterQualityDto";
import type { ComparisonPort } from "@/application/ports/ComparisonPort";
import type { ComparisonModuleFacade } from "@/modules/comparison";

export function createComparisonPortAdapter(
  module: ComparisonModuleFacade,
): ComparisonPort {
  return {
    async compare(measurements) {
      try {
        const compared = await module.compareMeasurements.execute(
          measurements.map((measurement) => ({
            ...measurement,
            parameterId: measurement.resolution?.canonicalId ?? null,
            canonicalNumericValue:
              measurement.resolution?.canonicalNumericValue ??
              measurement.numericValue,
            conversion: measurement.resolution?.conversion ?? null,
          })),
        );
        return compared.map(
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
            comparisons: measurement.comparisons,
          }),
        );
      } catch (error) {
        throw new ApplicationError("COMPARISON_UNAVAILABLE", error);
      }
    },
  };
}
