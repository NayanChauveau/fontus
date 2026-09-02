import { HUBEAU_ROW_HARD_CAP, HUBEAU_ROW_SOFT_CAP } from "./Analysis";

export const ANALYSIS_WINDOW_MONTHS = [36, 24, 18, 12, 6] as const;

export function windowFromDate(now: Date, months: number): string {
  const from = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - months, now.getUTCDate()),
  );
  return from.toISOString().slice(0, 10);
}

export function chooseAnalysisWindow(
  counts: ReadonlyArray<{ months: number; count: number }>,
): { months: number; count: number } {
  const longestUnder = (cap: number) =>
    counts
      .filter((entry) => entry.count <= cap)
      .sort((left, right) => right.months - left.months)[0];

  return (
    longestUnder(HUBEAU_ROW_SOFT_CAP) ??
    longestUnder(HUBEAU_ROW_HARD_CAP) ??
    counts[counts.length - 1] ?? { months: 6, count: 0 }
  );
}
