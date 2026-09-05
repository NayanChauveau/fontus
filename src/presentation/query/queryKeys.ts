export const QUERY_CACHE_STALE_MS = 30 * 60 * 1000;
export const QUERY_CACHE_GC_MS = 24 * 60 * 60 * 1000;
export const QUERY_PERSIST_KEY = "fontus-query-v1";

const NETWORKS = "networks";
const QUALITY = "quality";

export const queryKeys = {
  networks: (citycode: string) => [NETWORKS, citycode] as const,
  quality: (networkCode: string) => [QUALITY, networkCode] as const,
};

export function isPersistedQueryRoot(root: unknown) {
  return root === NETWORKS || root === QUALITY;
}
