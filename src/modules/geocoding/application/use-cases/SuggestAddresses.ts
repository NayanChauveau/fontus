import type { AddressCandidate } from "../../domain/AddressCandidate";
import type { GeocodingGatewayPort } from "../ports/GeocodingGatewayPort";

export class SuggestAddresses {
  constructor(private readonly gateway: GeocodingGatewayPort) {}

  execute(query: string): Promise<AddressCandidate[]> {
    return this.gateway.search(query, { autocomplete: true, limit: 7 });
  }
}
