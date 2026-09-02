import type { AddressCandidate } from "../../domain/AddressCandidate";

export type GeocodingSearchOptions = {
  autocomplete: boolean;
  limit: number;
};

export type GeocodingGatewayPort = {
  search(
    query: string,
    options: GeocodingSearchOptions,
  ): Promise<AddressCandidate[]>;
};
