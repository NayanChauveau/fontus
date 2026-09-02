export type HistoryTrend = "rising" | "falling" | "stable" | "insufficient";

export type HistoryPointInput = {
  value: number | null;
  qualifier: "eq" | "lt" | "gt";
};

export type HistorySummary = {
  min: number | null;
  max: number | null;
  median: number | null;
  count: number;
  trend: HistoryTrend;
  loqChanged: boolean;
};

const TREND_RELATIVE_THRESHOLD = 0.1;

export function summarizeHistory(
  points: readonly HistoryPointInput[],
): HistorySummary {
  const values = points
    .filter((point) => point.qualifier === "eq")
    .map((point) => point.value)
    .filter((value): value is number => value !== null && Number.isFinite(value));

  return {
    min: values.length === 0 ? null : Math.min(...values),
    max: values.length === 0 ? null : Math.max(...values),
    median: medianOf(values),
    count: values.length,
    trend: trendOf(values),
    loqChanged: detectLoqChange(points),
  };
}

function medianOf(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) {
    return sorted[middle]!;
  }
  return (sorted[middle - 1]! + sorted[middle]!) / 2;
}

function trendOf(values: number[]): HistoryTrend {
  if (values.length < 3) {
    return "insufficient";
  }
  const first = values[0]!;
  const last = values[values.length - 1]!;
  const span = Math.max(Math.abs(first), Math.abs(last), Number.EPSILON);
  const delta = last - first;
  if (Math.abs(delta) / span < TREND_RELATIVE_THRESHOLD) {
    return "stable";
  }
  return delta > 0 ? "rising" : "falling";
}

function detectLoqChange(points: readonly HistoryPointInput[]): boolean {
  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1]!;
    const current = points[index]!;
    if (previous.qualifier === "lt" || current.qualifier === "lt") {
      if (previous.qualifier !== current.qualifier) {
        return true;
      }
      if (previous.value !== current.value) {
        return true;
      }
    }
  }
  return false;
}
