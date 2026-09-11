import type { NetworkWaterQualityDto } from "@/application/dtos/NetworkWaterQualityDto";
import { fetchJson } from "@/components/fetchJson";

export function qualityUrl(networkCode: string, refresh = false) {
  const path = `/api/udi/${encodeURIComponent(networkCode)}/quality`;
  return refresh ? `${path}?refresh=1` : path;
}

export function fetchNetworkQuality(
  networkCode: string,
  signal: AbortSignal | undefined,
  refresh = false,
) {
  return fetchJson<NetworkWaterQualityDto>(
    qualityUrl(networkCode, refresh),
    signal,
  );
}
