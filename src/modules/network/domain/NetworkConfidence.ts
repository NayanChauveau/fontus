export type NetworkConfidence = "exact" | "ambiguous" | "none";

export const NETWORK_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export function isFreshSync(fetchedAt: Date, now: Date): boolean {
  return now.getTime() - fetchedAt.getTime() < NETWORK_CACHE_TTL_MS;
}
