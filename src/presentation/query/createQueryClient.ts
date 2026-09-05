import { QueryClient } from "@tanstack/react-query";
import { QUERY_CACHE_GC_MS, QUERY_CACHE_STALE_MS } from "./queryKeys";

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: QUERY_CACHE_STALE_MS,
        gcTime: QUERY_CACHE_GC_MS,
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  });
}
