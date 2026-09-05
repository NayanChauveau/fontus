import type { Query } from "@tanstack/react-query";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import {
  QUERY_CACHE_GC_MS,
  QUERY_PERSIST_KEY,
  isPersistedQueryRoot,
} from "./queryKeys";

export function shouldPersistQuery(query: Pick<Query, "queryKey" | "state">) {
  return (
    query.state.status === "success" && isPersistedQueryRoot(query.queryKey[0])
  );
}

export function createPersistOptions() {
  return {
    persister: createAsyncStoragePersister({
      key: QUERY_PERSIST_KEY,
      storage: typeof window === "undefined" ? undefined : window.localStorage,
    }),
    maxAge: QUERY_CACHE_GC_MS,
    dehydrateOptions: {
      shouldDehydrateQuery: shouldPersistQuery,
    },
  };
}
