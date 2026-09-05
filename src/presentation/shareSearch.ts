import { findCityByInsee, findCityBySlug } from "@/application/cities/largestCities";
import { normalizeAddressQuery } from "@/application/addressQuery";
import { isInseeCitycode, normalizeCitycode } from "@/application/citycode";
import { isNetworkCode, normalizeNetworkCode } from "@/application/networkCode";
import { cityPagePath, cityUdiPath } from "@/presentation/editorial/paths";

export const SHARE_INSEE_PARAM = "insee";
export const SHARE_UDI_PARAM = "udi";
export const SHARE_ADDRESS_PARAM = "adresse";

export type ShareSelection = {
  citycode: string | null;
  networkCode: string | null;
  addressLabel?: string | null;
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
  adresse?: string | string[];
}): boolean {
  return (
    firstSearchParam(params.insee) !== null ||
    firstSearchParam(params.udi) !== null ||
    firstSearchParam(params.adresse) !== null
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
    addressLabel: null,
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
  return {
    citycode,
    networkCode,
    addressLabel: readAddressLabel(params.get(SHARE_ADDRESS_PARAM)),
  };
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
  const addressLabel = readAddressLabel(input.addressLabel);
  if (addressLabel) {
    params.set(SHARE_ADDRESS_PARAM, addressLabel);
  }
  return params.toString();
}

export function pathForShare(input: ShareSelection): string {
  const citycode = readCitycode(input.citycode);
  if (!citycode) {
    return "/";
  }
  const networkCode = readNetworkCode(input.networkCode);
  const addressLabel = readAddressLabel(input.addressLabel);
  const city = findCityByInsee(citycode);
  if (city) {
    const path = networkCode
      ? cityUdiPath(city.slug, networkCode)
      : cityPagePath(city.slug);
    if (addressLabel && !isCityOnlyLabel(addressLabel, city.name)) {
      const params = new URLSearchParams();
      params.set(SHARE_ADDRESS_PARAM, addressLabel);
      return `${path}?${params}`;
    }
    return path;
  }
  const query = buildShareSearch({ citycode, networkCode, addressLabel });
  return query ? `/?${query}` : "/";
}

function isCityOnlyLabel(label: string, cityName: string): boolean {
  return label.toLocaleLowerCase("fr-FR") === cityName.toLocaleLowerCase("fr-FR");
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

function readAddressLabel(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }
  const normalized = normalizeAddressQuery(value);
  return normalized.length > 0 ? normalized : null;
}
