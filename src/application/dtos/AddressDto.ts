export type AddressSuggestionDto = {
  id: string;
  label: string;
  city: string;
  citycode: string;
  longitude: number;
  latitude: number;
};

export type ResolvedAddressDto = AddressSuggestionDto;

export type SuggestAddressesResultDto = {
  suggestions: AddressSuggestionDto[];
};

export type ResolveAddressResultDto = {
  address: ResolvedAddressDto | null;
};
