import type { AddressSuggestionDto } from "../dtos/AddressDto";

export type ResolveAddressInput = {
  id: string;
  label: string;
};

export type GeocodingPort = {
  suggest(query: string): Promise<AddressSuggestionDto[]>;
  resolve(input: ResolveAddressInput): Promise<AddressSuggestionDto | null>;
};
