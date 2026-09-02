import type { AddressSuggestionDto } from "@/application/dtos/AddressDto";
import { ApplicationError } from "@/application/errors/ApplicationError";
import type { GeocodingPort } from "@/application/ports/GeocodingPort";
import type {
  AddressCandidate,
  GeocodingModuleFacade,
} from "@/modules/geocoding";

function toDto(candidate: AddressCandidate): AddressSuggestionDto {
  return {
    id: candidate.sourceId,
    label: candidate.label,
    city: candidate.city,
    citycode: candidate.citycode,
    longitude: candidate.longitude,
    latitude: candidate.latitude,
  };
}

export function createGeocodingPortAdapter(
  module: GeocodingModuleFacade,
): GeocodingPort {
  return {
    async suggest(query) {
      try {
        const candidates = await module.suggestAddresses.execute(query);
        return candidates.map(toDto);
      } catch (error) {
        throw new ApplicationError("GEOCODING_UNAVAILABLE", error);
      }
    },

    async resolve(input) {
      try {
        const match = await module.resolveAddress.execute(input);
        return match ? toDto(match) : null;
      } catch (error) {
        throw new ApplicationError("GEOCODING_UNAVAILABLE", error);
      }
    },
  };
}
