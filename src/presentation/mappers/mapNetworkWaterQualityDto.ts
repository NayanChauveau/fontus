import type {
  MeasurementDto,
  NetworkWaterQualityDto,
} from "@/application/dtos/NetworkWaterQualityDto";
import { fr } from "../i18n/fr";
import type {
  NetworkAnalysesViewModel,
  NetworkMeasurementViewModel,
} from "../view-models/NetworkAnalysesViewModel";

export function mapNetworkWaterQualityDto(
  dto: NetworkWaterQualityDto,
): NetworkAnalysesViewModel {
  const sample = dto.latestSample;
  const sampledAtLabel = sample ? formatSampledAt(sample.sampledAt) : null;
  const sourceLabel =
    sample?.source === "hubeau"
      ? fr.analyses.sourceHubEau
      : sample?.source ?? fr.analyses.sourceHubEau;
  const measurements = dto.latestMeasurements.map((measurement) =>
    toMeasurementViewModel(
      measurement,
      measurement.sampledAt
        ? formatSampledAt(measurement.sampledAt)
        : (sampledAtLabel ?? ""),
      sourceLabel,
    ),
  );

  return {
    networkCode: dto.networkCode,
    sampledAtLabel,
    conclusion: sample?.conclusion ?? null,
    officialNote: fr.analyses.officialNote,
    perParameterDateNote: fr.analyses.perParameterDateNote,
    sourceLabel:
      dto.source === "cache"
        ? fr.analyses.sourceCache
        : fr.analyses.sourceRemote,
    priorityMeasurements: measurements.filter((row) => row.priority),
    otherMeasurements: measurements.filter((row) => !row.priority),
  };
}

function toMeasurementViewModel(
  measurement: MeasurementDto,
  sampledAtLabel: string,
  sourceLabel: string,
): NetworkMeasurementViewModel {
  const resolution = measurement.resolution;
  const canonicalName = resolution?.canonicalName ?? null;
  const showOriginal =
    canonicalName !== null && canonicalName !== measurement.parameterLabel;

  return {
    parameterCode: measurement.parameterCode,
    parameterLabel: canonicalName ?? measurement.parameterLabel,
    canonicalName,
    canonicalId: resolution?.canonicalId ?? null,
    originalLabel: showOriginal ? measurement.parameterLabel : null,
    valueLabel: measurement.unit
      ? `${measurement.rawText} ${measurement.unit}`
      : measurement.rawText,
    canonicalValueLabel: formatCanonicalValue(measurement),
    converted: resolution?.conversion === "converted",
    sampledAtLabel,
    sourceLabel,
    priority: (resolution?.displayPriority ?? 9999) < 1000,
  };
}

function formatCanonicalValue(measurement: MeasurementDto): string | null {
  const resolution = measurement.resolution;
  if (!resolution) {
    return null;
  }
  if (
    resolution.conversion === "not_numeric" ||
    resolution.conversion === "not_convertible" ||
    resolution.canonicalNumericValue === null
  ) {
    return null;
  }

  const prefix =
    measurement.qualifier === "lt"
      ? "< "
      : measurement.qualifier === "gt"
        ? "> "
        : "";
  const unit = resolution.canonicalUnit ?? "";
  return `${prefix}${formatFrenchNumber(resolution.canonicalNumericValue)}${
    unit ? ` ${unit}` : ""
  }`;
}

function formatFrenchNumber(value: number): string {
  return new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 6,
  }).format(value);
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
