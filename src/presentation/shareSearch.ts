import { findCityByInsee, findCityBySlug } from "@/application/cities/largestCities";
import { isInseeCitycode, normalizeCitycode } from "@/application/citycode";
import { isNetworkCode, normalizeNetworkCode } from "@/application/networkCode";
import { cityPagePath, cityUdiPath } from "@/presentation/editorial/paths";

export const SHARE_INSEE_PARAM = "insee";
export const SHARE_UDI_PARAM = "udi";

export type ShareSelection = {
  citycode: string | null;
  networkCode: string | null;
};

export function firstSearchParam(
  value: string | string[] | undefined,
): string | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) {
    return null;
  }
  return raw;
}

export function hasShareQueryParams(params: {
  insee?: string | string[];
  udi?: string | string[];
}): boolean {
  return (
    firstSearchParam(params.insee) !== null ||
    firstSearchParam(params.udi) !== null
  );
}

export function parseSharePath(pathname: string): ShareSelection | null {
  const match = pathname.match(/^\/eau-robinet\/([^/]+)(?:\/([^/]+))?$/);
  if (!match) {
    return null;
  }
  const city = findCityBySlug(match[1] ?? "");
  if (!city) {
    return null;
  }
  return {
    citycode: city.insee,
    networkCode: readNetworkCode(match[2] ?? null),
  };
}

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

export function pathForShare(input: ShareSelection): string {
  const citycode = readCitycode(input.citycode);
  if (!citycode) {
    return "/";
  }
  const networkCode = readNetworkCode(input.networkCode);
  const city = findCityByInsee(citycode);
  if (city) {
    return networkCode
      ? cityUdiPath(city.slug, networkCode)
      : cityPagePath(city.slug);
  }
  const query = buildShareSearch({ citycode, networkCode });
  return query ? `/?${query}` : "/";
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
