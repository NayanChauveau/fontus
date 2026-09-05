export type NetworkConfidence = "exact" | "ambiguous" | "none";

const NETWORK_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const EMPTY_YEAR_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export function isFreshSync(fetchedAt: Date, now: Date): boolean {
  return now.getTime() - fetchedAt.getTime() < NETWORK_CACHE_TTL_MS;
}

export function isFreshEmptyYear(fetchedAt: Date, now: Date): boolean {
  return now.getTime() - fetchedAt.getTime() < EMPTY_YEAR_CACHE_TTL_MS;
}
