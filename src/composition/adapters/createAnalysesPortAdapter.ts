import type { NetworkWaterQualityDto } from "@/application/dtos/NetworkWaterQualityDto";
import { ApplicationError } from "@/application/errors/ApplicationError";
import type { AnalysesPort } from "@/application/ports/AnalysesPort";
import type { AnalysesModuleFacade } from "@/modules/analyses";
import type { AnalysisSample } from "@/modules/analyses/domain/Analysis";

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
    measurements: sample.measurements.map((measurement) => ({
      parameterCode: measurement.parameterCode,
      parameterLabel: measurement.parameterLabel,
      rawText: measurement.rawText,
      numericValue: measurement.numericValue,
      qualifier: measurement.qualifier,
      unit: measurement.unit,
    })),
  };
}
