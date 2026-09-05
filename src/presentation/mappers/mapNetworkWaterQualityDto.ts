import type {
  ComparisonDto,
  MeasurementDto,
  NetworkWaterQualityDto,
  ParameterHistoryDto,
} from "@/application/dtos/NetworkWaterQualityDto";
import { fr } from "../i18n/fr";
import type { Messages } from "../i18n/messages";
import type {
  ComparisonViewModel,
  NetworkAnalysesViewModel,
  NetworkMeasurementViewModel,
  ParameterHistoryViewModel,
} from "../view-models/NetworkAnalysesViewModel";
import { buildExhaustiveRows } from "./buildExhaustiveRows";
import { buildPriorityCards } from "./buildPriorityCards";
import { collectSources } from "./collectSources";
import { resolveBannerTone } from "./resolveBannerTone";

export type MapperI18n = {
  messages: Messages;
  dateLocale: string;
};

const defaultI18n: MapperI18n = {
  messages: fr,
  dateLocale: "fr-FR",
};

export function mapNetworkWaterQualityDto(
  dto: NetworkWaterQualityDto,
  i18n: MapperI18n = defaultI18n,
): NetworkAnalysesViewModel {
  const { messages, dateLocale } = i18n;
  const sample = dto.latestSample;
  const sampledAtLabel = sample
    ? formatSampledAt(sample.sampledAt, dateLocale)
    : null;
  const sourceLabel =
    sample?.source === "hubeau"
      ? messages.analyses.sourceHubEau
      : sample?.source ?? messages.analyses.sourceHubEau;
  const measurements = dto.latestMeasurements.map((measurement) =>
    toMeasurementViewModel(
      measurement,
      measurement.sampledAt
        ? formatSampledAt(measurement.sampledAt, dateLocale)
        : (sampledAtLabel ?? ""),
      sourceLabel,
      dto.networkCode,
      i18n,
    ),
  );

  const priorityMeasurements = measurements.filter((row) => row.priority);
  const pageSourceLabel =
    dto.source === "cache"
      ? messages.analyses.sourceCache
      : dto.source === "import"
        ? messages.analyses.sourceImport
        : messages.analyses.sourceRemote;

  return {
    networkCode: dto.networkCode,
    sampledAtLabel,
    conclusion: sample?.conclusion ?? null,
    bannerTone: resolveBannerTone({
      conclusion: sample?.conclusion ?? null,
      conformiteLimitesBact: sample?.conformiteLimitesBact ?? null,
      conformiteLimitesPc: sample?.conformiteLimitesPc ?? null,
    }),
    limitesBactLabel: limiteLabel(
      sample?.conformiteLimitesBact ?? null,
      messages,
    ),
    limitesPcLabel: limiteLabel(sample?.conformiteLimitesPc ?? null, messages),
    officialNote: messages.analyses.officialNote.replace(
      "{{date}}",
      sampledAtLabel ?? "—",
    ),
    cardsCampaignNote: messages.analyses.cardsCampaignNote,
    comparisonFailed: dto.comparisonFailed === true,
    perParameterDateNote: messages.analyses.perParameterDateNote,
    disclaimer: messages.analyses.disclaimer,
    sourceLabel: pageSourceLabel,
    windowFromLabel: dto.windowFrom
      ? formatDateOnly(dto.windowFrom, dateLocale)
      : null,
    parameterHistories: (dto.parameterHistories ?? []).map((history) =>
      toHistoryViewModel(history, i18n),
    ),
    priorityCards: buildPriorityCards(
      priorityMeasurements,
      messages,
      dateLocale,
    ),
    priorityMeasurements,
    otherMeasurements: measurements.filter((row) => !row.priority),
    exhaustiveMeasurements: buildExhaustiveRows(
      measurements,
      {
        networkCode: dto.networkCode,
        hasRecentSample: sample !== null || measurements.length > 0,
      },
      messages,
    ),
    reconstructedSumNote: measurements.some((row) => row.reconstructed)
      ? messages.analyses.reconstructedSumNote
      : null,
    sources: collectSources(
      measurements,
      pageSourceLabel,
      messages,
      dateLocale,
    ),
  };
}

function toMeasurementViewModel(
  measurement: MeasurementDto,
  sampledAtLabel: string,
  sourceLabel: string,
  udiLabel: string,
  i18n: MapperI18n,
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
    category: resolution?.category ?? null,
    originalLabel: showOriginal ? measurement.parameterLabel : null,
    valueLabel: measurement.unit
      ? `${measurement.rawText} ${measurement.unit}`
      : measurement.rawText,
    canonicalValueLabel: formatCanonicalValue(measurement, i18n.dateLocale),
    converted: resolution?.conversion === "converted",
    reconstructed: resolution?.derived === "reconstructed_sum",
    sampledAtLabel,
    sourceLabel,
    udiLabel,
    unitLabel: resolution?.canonicalUnit ?? measurement.unit,
    emptyKind: null,
    priority: (resolution?.displayPriority ?? 9999) < 1000,
    fr: toComparisonViewModel(measurement.comparisons?.fr ?? null, i18n.messages),
    eu: toComparisonViewModel(measurement.comparisons?.eu ?? null, i18n.messages),
    ch: toComparisonViewModel(measurement.comparisons?.ch ?? null, i18n.messages),
    us: toComparisonViewModel(measurement.comparisons?.us ?? null, i18n.messages),
    who: toComparisonViewModel(measurement.comparisons?.who ?? null, i18n.messages),
    strict: toComparisonViewModel(
      measurement.comparisons?.strict ?? null,
      i18n.messages,
    ),
  };
}

function toComparisonViewModel(
  comparison: ComparisonDto | null,
  messages: Messages,
): ComparisonViewModel | null {
  if (!comparison) {
    return null;
  }
  return {
    status: comparison.status,
    statusLabel: statusLabel(comparison.status, messages),
    thresholdLabel: comparison.thresholdLabel,
    kindLabel: kindLabel(comparison.kind, messages),
    citation: comparison.citation,
    sourceUrl: comparison.sourceUrl,
    binding: comparison.binding,
    siteMetric: comparison.kind === "site_metric",
  };
}

function limiteLabel(code: string | null, messages: Messages): string | null {
  if (code === "C") {
    return messages.analyses.conformeCode;
  }
  if (code === "N") {
    return messages.analyses.nonConformeCode;
  }
  return null;
}

function statusLabel(
  status: ComparisonDto["status"],
  messages: Messages,
): string {
  if (status === "compliant") {
    return messages.analyses.compliant;
  }
  if (status === "exceedance") {
    return messages.analyses.exceedance;
  }
  if (status === "below_loq") {
    return messages.analyses.belowLoq;
  }
  if (status === "not_comparable") {
    return messages.analyses.notComparable;
  }
  return messages.analyses.noThreshold;
}

function kindLabel(
  kind: ComparisonDto["kind"],
  messages: Messages,
): string | null {
  if (kind === "legal_limit") {
    return messages.analyses.legalLimit;
  }
  if (kind === "quality_reference") {
    return messages.analyses.qualityReference;
  }
  if (kind === "site_metric") {
    return messages.analyses.siteMetric;
  }
  return null;
}

function formatCanonicalValue(
  measurement: MeasurementDto,
  dateLocale: string,
): string | null {
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
  return `${prefix}${formatNumber(resolution.canonicalNumericValue, dateLocale)}${
    unit ? ` ${unit}` : ""
  }`;
}

function formatNumber(value: number, dateLocale: string): string {
  return new Intl.NumberFormat(dateLocale, {
    maximumFractionDigits: 6,
  }).format(value);
}

function formatSampledAt(iso: string, dateLocale: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return new Intl.DateTimeFormat(dateLocale, {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Europe/Paris",
  }).format(date);
}

function formatDateOnly(iso: string, dateLocale: string): string {
  const date = new Date(iso.includes("T") ? iso : `${iso}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return new Intl.DateTimeFormat(dateLocale, {
    dateStyle: "long",
    timeZone: "Europe/Paris",
  }).format(date);
}

function toHistoryViewModel(
  history: ParameterHistoryDto,
  i18n: MapperI18n,
): ParameterHistoryViewModel {
  const unit = history.unit ?? "";
  return {
    canonicalId: history.canonicalId,
    title: history.canonicalName,
    unit: history.unit,
    statsLabel:
      history.count === 0
        ? i18n.messages.analyses.historyNoStats
        : i18n.messages.analyses.historyStats
            .replace("{{min}}", formatStat(history.min, unit, i18n.dateLocale))
            .replace(
              "{{median}}",
              formatStat(history.median, unit, i18n.dateLocale),
            )
            .replace("{{max}}", formatStat(history.max, unit, i18n.dateLocale))
            .replace("{{count}}", String(history.count)),
    trend: history.trend,
    trendLabel: historyTrendLabel(history.trend, i18n.messages),
    warningLabels: history.warnings.includes("loq_changed")
      ? [i18n.messages.analyses.historyLoqChanged]
      : [],
    points: history.points.map((point) => ({
      sampledAtLabel: point.sampledAt
        ? formatSampledAt(point.sampledAt, i18n.dateLocale)
        : "",
      valueLabel: formatHistoryPoint(point, unit, i18n.dateLocale),
      y:
        point.qualifier === "eq"
          ? (point.resolution?.canonicalNumericValue ?? point.numericValue)
          : null,
    })),
  };
}

function formatStat(
  value: number | null,
  unit: string,
  dateLocale: string,
): string {
  if (value === null) {
    return "—";
  }
  return `${formatNumber(value, dateLocale)}${unit ? ` ${unit}` : ""}`;
}

function formatHistoryPoint(
  point: MeasurementDto,
  fallbackUnit: string,
  dateLocale: string,
): string {
  const canonical = formatCanonicalValue(point, dateLocale);
  if (canonical) {
    return canonical;
  }
  return point.unit
    ? `${point.rawText} ${point.unit}`
    : fallbackUnit
      ? `${point.rawText} ${fallbackUnit}`
      : point.rawText;
}

function historyTrendLabel(
  trend: ParameterHistoryDto["trend"],
  messages: Messages,
): string {
  if (trend === "rising") {
    return messages.analyses.historyTrendRising;
  }
  if (trend === "falling") {
    return messages.analyses.historyTrendFalling;
  }
  if (trend === "stable") {
    return messages.analyses.historyTrendStable;
  }
  return messages.analyses.historyTrendInsufficient;
}
