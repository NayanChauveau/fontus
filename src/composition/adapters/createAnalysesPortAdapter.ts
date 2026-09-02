import type { NetworkWaterQualityDto } from "@/application/dtos/NetworkWaterQualityDto";
import { ApplicationError } from "@/application/errors/ApplicationError";
import type { AnalysesPort } from "@/application/ports/AnalysesPort";
import type { AnalysesModuleFacade } from "@/modules/analyses";
import type {
  AnalysisSample,
  ParameterSnapshot,
} from "@/modules/analyses/domain/Analysis";

export function createAnalysesPortAdapter(
  module: AnalysesModuleFacade,
): AnalysesPort {
  return {
    async getByNetworkCode(networkCode) {
      try {
        const result = await module.getNetworkAnalyses.execute(networkCode);
        return {
          networkCode: result.networkCode,
          windowFrom: result.windowFrom,
          source: result.source,
          latestSample: result.latestSample
            ? toSampleDto(result.latestSample)
            : null,
          latestMeasurements: result.latestMeasurements.map(toMeasurementDto),
        } satisfies NetworkWaterQualityDto;
      } catch (error) {
        throw new ApplicationError("ANALYSES_UNAVAILABLE", error);
      }
    },
  };
}

function toSampleDto(sample: AnalysisSample): NetworkWaterQualityDto["latestSample"] {
  return {
    code: sample.code,
    sampledAt: sample.sampledAt.toISOString(),
    conclusion: sample.conclusion,
    conformiteLimitesBact: sample.conformiteLimitesBact,
    conformiteLimitesPc: sample.conformiteLimitesPc,
    source: sample.source,
    measurements: sample.measurements.map((measurement) =>
      toMeasurementDto({
        sampledAt: sample.sampledAt,
        measurement,
      }),
    ),
  };
}

function toMeasurementDto(
  snapshot: ParameterSnapshot,
): NonNullable<NetworkWaterQualityDto["latestSample"]>["measurements"][number] {
  const { measurement, sampledAt } = snapshot;
  return {
    parameterCode: measurement.parameterCode,
    parameterLabel: measurement.parameterLabel,
    siseCode: measurement.siseCode,
    casCode: measurement.casCode,
    rawText: measurement.rawText,
    numericValue: measurement.numericValue,
    qualifier: measurement.qualifier,
    unit: measurement.unit,
    sampledAt: sampledAt.toISOString(),
    resolution: null,
  };
}
