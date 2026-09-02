import {
  type AddressCandidate,
  isInseeCitycode,
} from "./AddressCandidate";

export function toAddressCandidate(input: {
  sourceId?: unknown;
  label?: unknown;
  city?: unknown;
  citycode?: unknown;
  longitude?: unknown;
  latitude?: unknown;
}): AddressCandidate | null {
  if (typeof input.sourceId !== "string" || input.sourceId.length === 0) {
    return null;
  }
  if (typeof input.label !== "string" || input.label.length === 0) {
    return null;
  }
  if (typeof input.city !== "string" || input.city.length === 0) {
    return null;
  }
  if (typeof input.citycode !== "string" || !isInseeCitycode(input.citycode)) {
    return null;
  }
  if (typeof input.longitude !== "number" || !Number.isFinite(input.longitude)) {
    return null;
  }
  if (typeof input.latitude !== "number" || !Number.isFinite(input.latitude)) {
    return null;
  }

  return {
    sourceId: input.sourceId,
    label: input.label,
    city: input.city,
    citycode: input.citycode.toUpperCase(),
    longitude: input.longitude,
    latitude: input.latitude,
  };
}
