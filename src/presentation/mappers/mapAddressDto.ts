import type { AddressSuggestionDto } from "@/application/dtos/AddressDto";
import type { AddressSuggestionViewModel } from "../view-models/AddressViewModel";

function formatCoordinate(value: number): string {
  return value.toFixed(6);
}

export function mapAddressDtoToViewModel(
  dto: AddressSuggestionDto,
): AddressSuggestionViewModel {
  return {
    id: dto.id,
    label: dto.label,
    city: dto.city,
    citycode: dto.citycode,
    coordinates: `${formatCoordinate(dto.latitude)}, ${formatCoordinate(dto.longitude)}`,
  };
}
