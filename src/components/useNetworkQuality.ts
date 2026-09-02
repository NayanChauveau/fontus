"use client";

import { useEffect, useMemo, useState } from "react";
import type { NetworkWaterQualityDto } from "@/application/dtos/NetworkWaterQualityDto";
import { intlLocale } from "@/presentation/i18n/messages";
import { useLocale, useMessages } from "@/presentation/i18n/useLocale";
import { mapNetworkWaterQualityDto } from "@/presentation/mappers/mapNetworkWaterQualityDto";

type LoadStatus = "loading" | "ready" | "unavailable";

export function useNetworkQuality(networkCode: string) {
  const messages = useMessages();
  const locale = useLocale();
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [dto, setDto] = useState<NetworkWaterQualityDto | null>(null);
  const viewModel = useMemo(
    () =>
      dto
        ? mapNetworkWaterQualityDto(dto, {
            messages,
            dateLocale: intlLocale(locale),
          })
        : null,
    [dto, locale, messages],
  );

  useEffect(() => {
    const controller = new AbortController();

    void (async () => {
      try {
        const response = await fetch(
          `/api/udi/${encodeURIComponent(networkCode)}/quality`,
          { signal: controller.signal },
        );
        const payload = (await response.json()) as
          | NetworkWaterQualityDto
          | { error: string };

        if (!response.ok || "error" in payload) {
          setStatus("unavailable");
          return;
        }

        setDto(payload);
        setStatus("ready");
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        setStatus("unavailable");
      }
    })();

    return () => {
      controller.abort();
    };
  }, [networkCode]);

  return { status, viewModel };
}
