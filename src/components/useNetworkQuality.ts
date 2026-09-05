"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import type { NetworkWaterQualityDto } from "@/application/dtos/NetworkWaterQualityDto";
import { fetchJson } from "@/components/fetchJson";
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
  const query = useQuery({
    queryKey: queryKeys.quality(networkCode),
    queryFn: ({ signal }) =>
      fetchJson<NetworkWaterQualityDto>(
        `/api/udi/${encodeURIComponent(networkCode)}/quality`,
        signal,
      ),
    enabled: hydrated,
  });
  const data = hydrated ? query.data : undefined;
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

  return { status, viewModel };
}
