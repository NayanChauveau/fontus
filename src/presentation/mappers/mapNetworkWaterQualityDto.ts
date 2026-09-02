import type {
  ComparisonDto,
  MeasurementDto,
  NetworkWaterQualityDto,
} from "@/application/dtos/NetworkWaterQualityDto";
import { fr } from "../i18n/fr";
import type {
  ComparisonViewModel,
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
    reconstructedSumNote: measurements.some((row) => row.reconstructed)
      ? fr.analyses.reconstructedSumNote
      : null,
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
    reconstructed: resolution?.derived === "reconstructed_sum",
    sampledAtLabel,
    sourceLabel,
    priority: (resolution?.displayPriority ?? 9999) < 1000,
    fr: toComparisonViewModel(measurement.comparisons?.fr ?? null),
    eu: toComparisonViewModel(measurement.comparisons?.eu ?? null),
    ch: toComparisonViewModel(measurement.comparisons?.ch ?? null),
    us: toComparisonViewModel(measurement.comparisons?.us ?? null),
    strict: toComparisonViewModel(measurement.comparisons?.strict ?? null),
  };
}

function toComparisonViewModel(
  comparison: ComparisonDto | null,
): ComparisonViewModel | null {
  if (!comparison) {
    return null;
  }
  return {
    status: comparison.status,
    statusLabel: statusLabel(comparison.status),
    thresholdLabel: comparison.thresholdLabel,
    kindLabel: kindLabel(comparison.kind),
    citation: comparison.citation,
    sourceUrl: comparison.sourceUrl,
    binding: comparison.binding,
    siteMetric: comparison.kind === "site_metric",
  };
}

function statusLabel(status: ComparisonDto["status"]): string {
  if (status === "compliant") {
    return fr.analyses.compliant;
  }
  if (status === "exceedance") {
    return fr.analyses.exceedance;
  }
  if (status === "below_loq") {
    return fr.analyses.belowLoq;
  }
  if (status === "not_comparable") {
    return fr.analyses.notComparable;
  }
  return fr.analyses.noThreshold;
}

function kindLabel(
  kind: ComparisonDto["kind"],
): string | null {
  if (kind === "legal_limit") {
    return fr.analyses.legalLimit;
  }
  if (kind === "quality_reference") {
    return fr.analyses.qualityReference;
  }
  if (kind === "site_metric") {
    return fr.analyses.siteMetric;
  }
  return null;
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
