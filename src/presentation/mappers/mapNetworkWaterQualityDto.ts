import type { NetworkWaterQualityDto } from "@/application/dtos/NetworkWaterQualityDto";
import { fr } from "../i18n/fr";
import type { NetworkAnalysesViewModel } from "../view-models/NetworkAnalysesViewModel";

export function mapNetworkWaterQualityDto(
  dto: NetworkWaterQualityDto,
): NetworkAnalysesViewModel {
  const sample = dto.latestSample;
  const sampledAtLabel = sample ? formatSampledAt(sample.sampledAt) : null;

  return {
    networkCode: dto.networkCode,
    sampledAtLabel,
    conclusion: sample?.conclusion ?? null,
    officialNote: fr.analyses.officialNote,
    sourceLabel:
      dto.source === "cache"
        ? fr.analyses.sourceCache
        : fr.analyses.sourceRemote,
    measurements: (sample?.measurements ?? []).map((measurement) => ({
      parameterCode: measurement.parameterCode,
      parameterLabel: measurement.parameterLabel,
      valueLabel: measurement.unit
        ? `${measurement.rawText} ${measurement.unit}`
        : measurement.rawText,
      sampledAtLabel: sampledAtLabel ?? "",
      sourceLabel: sample?.source === "hubeau" ? fr.analyses.sourceHubEau : sample?.source ?? "",
    })),
  };
}

function formatSampledAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Europe/Paris",
  }).format(date);
}
