"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef } from "react";
import { fetchNetworkQuality } from "@/components/fetchNetworkQuality";
import { intlLocale } from "@/presentation/i18n/messages";
import { useLocale, useMessages } from "@/presentation/i18n/useLocale";
import { mapNetworkWaterQualityDto } from "@/presentation/mappers/mapNetworkWaterQualityDto";
import { queryKeys } from "@/presentation/query/queryKeys";
import { useAfterHydration } from "@/presentation/query/useAfterHydration";

type LoadStatus = "loading" | "ready" | "unavailable";

export function useNetworkQuality(networkCode: string) {
  const messages = useMessages();
  const locale = useLocale();
  const hydrated = useAfterHydration();
  const queryClient = useQueryClient();
  const startedRefreshFor = useRef<string>("");
  const query = useQuery({
    queryKey: queryKeys.quality(networkCode),
    queryFn: ({ signal }) => fetchNetworkQuality(networkCode, signal),
    enabled: hydrated,
  });
  const data = hydrated ? query.data : undefined;

  useEffect(() => {
    if (!hydrated || data?.stale !== true) {
      return;
    }
    if (startedRefreshFor.current === networkCode) {
      return;
    }
    startedRefreshFor.current = networkCode;
    void queryClient.query({
      queryKey: queryKeys.quality(networkCode),
      staleTime: 0,
      queryFn: ({ signal }) =>
        fetchNetworkQuality(networkCode, signal, true),
    });
  }, [data, hydrated, networkCode, queryClient]);

  const viewModel = useMemo(
    () =>
      data
        ? mapNetworkWaterQualityDto(data, {
            messages,
            dateLocale: intlLocale(locale),
          })
        : null,
    [data, locale, messages],
  );

  const status: LoadStatus = data
    ? "ready"
    : hydrated && query.isError
      ? "unavailable"
      : "loading";

  return {
    status,
    viewModel,
    revalidating: Boolean(data) && query.isFetching,
  };
}
