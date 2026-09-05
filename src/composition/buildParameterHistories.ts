import type {
  MeasurementDto,
  ParameterHistoryDto,
} from "@/application/dtos/NetworkWaterQualityDto";
import { summarizeHistory } from "@/modules/analyses/domain/summarizeHistory";

const HISTORY_CANONICAL_IDS = ["nitrates", "pfas20", "lead"] as const;

export function buildParameterHistories(
  measurements: MeasurementDto[],
): ParameterHistoryDto[] {
  const grouped = new Map<string, MeasurementDto[]>();
  for (const measurement of measurements) {
    const canonicalId = measurement.resolution?.canonicalId;
    if (
      !canonicalId ||
      !HISTORY_CANONICAL_IDS.includes(
        canonicalId as (typeof HISTORY_CANONICAL_IDS)[number],
      )
    ) {
      continue;
    }
    const rows = grouped.get(canonicalId) ?? [];
    rows.push(measurement);
    grouped.set(canonicalId, rows);
  }

  return HISTORY_CANONICAL_IDS.flatMap((canonicalId) => {
    const points = grouped.get(canonicalId);
    if (!points || points.length === 0) {
      return [];
    }
    const sorted = [...points].sort((left, right) =>
      (left.sampledAt ?? "").localeCompare(right.sampledAt ?? ""),
    );
    const summary = summarizeHistory(
      sorted.map((point) => ({
        value: point.resolution?.canonicalNumericValue ?? point.numericValue,
        qualifier: point.qualifier,
      })),
    );
    const first = sorted[0]!;
    return [
      {
        canonicalId,
        canonicalName: first.resolution?.canonicalName || first.parameterLabel,
        unit: first.resolution?.canonicalUnit || first.unit,
        points: sorted,
        min: summary.min,
        max: summary.max,
        median: summary.median,
        count: summary.count,
        trend: summary.trend,
        warnings: summary.loqChanged ? ["loq_changed"] : [],
      },
    ];
  });
}
