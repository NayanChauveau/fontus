import type { AddressCandidate } from "../../domain/AddressCandidate";
import { toAddressCandidate } from "../../domain/toAddressCandidate";

export function parseGeoPfSearchResponse(payload: unknown): AddressCandidate[] {
  if (!payload || typeof payload !== "object") {
    return [];
  }

  const features = (payload as { features?: unknown }).features;
  if (!Array.isArray(features)) {
    return [];
  }

  const candidates: AddressCandidate[] = [];

  for (const feature of features) {
    if (!feature || typeof feature !== "object") {
      continue;
    }

    const record = feature as {
      geometry?: { coordinates?: unknown };
      properties?: Record<string, unknown>;
    };
    const coordinates = record.geometry?.coordinates;
    if (!Array.isArray(coordinates) || coordinates.length < 2) {
      continue;
    }

    const candidate = toAddressCandidate({
      sourceId: record.properties?.id,
      label: record.properties?.label,
      city: record.properties?.city,
      citycode: record.properties?.citycode,
      longitude: coordinates[0],
      latitude: coordinates[1],
    });

    if (candidate) {
      candidates.push(candidate);
    }
  }

  return candidates;
}
