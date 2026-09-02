import type { AddressCandidate } from "../../domain/AddressCandidate";
import type { GeocodingGatewayPort } from "../ports/GeocodingGatewayPort";

export class ResolveAddress {
  constructor(private readonly gateway: GeocodingGatewayPort) {}

  async execute(input: {
    id: string;
    label: string;
  }): Promise<AddressCandidate | null> {
    const candidates = await this.gateway.search(input.label, {
      autocomplete: false,
      limit: 5,
    });
    return (
      candidates.find((candidate) => candidate.sourceId === input.id) ?? null
    );
  }
}
