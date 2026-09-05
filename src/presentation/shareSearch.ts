import { isInseeCitycode, normalizeCitycode } from "@/application/citycode";
import { isNetworkCode, normalizeNetworkCode } from "@/application/networkCode";

export const SHARE_INSEE_PARAM = "insee";
export const SHARE_UDI_PARAM = "udi";

export type ShareSelection = {
  citycode: string | null;
  networkCode: string | null;
};

export function parseShareSearch(search: string): ShareSelection {
  const params = new URLSearchParams(
    search.startsWith("?") ? search.slice(1) : search,
  );
  const citycode = readCitycode(params.get(SHARE_INSEE_PARAM));
  const networkCode = citycode
    ? readNetworkCode(params.get(SHARE_UDI_PARAM))
    : null;
  return { citycode, networkCode };
}

export function buildShareSearch(input: ShareSelection): string {
  const params = new URLSearchParams();
  const citycode = readCitycode(input.citycode);
  if (!citycode) {
    return "";
  }
  params.set(SHARE_INSEE_PARAM, citycode);
  const networkCode = readNetworkCode(input.networkCode);
  if (networkCode) {
    params.set(SHARE_UDI_PARAM, networkCode);
  }
  return params.toString();
}

function readCitycode(value: string | null): string | null {
  if (!value || !isInseeCitycode(value)) {
    return null;
  }
  return normalizeCitycode(value);
}

function readNetworkCode(value: string | null): string | null {
  if (!value || !isNetworkCode(value)) {
    return null;
  }
  return normalizeNetworkCode(value);
}
