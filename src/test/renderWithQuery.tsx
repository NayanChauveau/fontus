import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import { QUERY_CACHE_STALE_MS } from "@/presentation/query/queryKeys";

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: QUERY_CACHE_STALE_MS,
        gcTime: Infinity,
      },
    },
  });
}

export function renderWithQuery(
  ui: ReactElement,
  client: QueryClient = createTestQueryClient(),
) {
  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  }

  return { ...render(ui, { wrapper: Wrapper }), client };
}
