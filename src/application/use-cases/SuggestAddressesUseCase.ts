import {
  isAddressQueryTooShort,
  normalizeAddressQuery,
} from "../addressQuery";
import type { SuggestAddressesResultDto } from "../dtos/AddressDto";
import type { ApplicationPorts } from "../ports/ApplicationPorts";

export class SuggestAddressesUseCase {
  constructor(private readonly ports: ApplicationPorts) {}

  async execute(query: string): Promise<SuggestAddressesResultDto> {
    if (isAddressQueryTooShort(query)) {
      return { suggestions: [] };
    }

    const suggestions = await this.ports.geocoding.suggest(
      normalizeAddressQuery(query),
    );
    return { suggestions };
  }
}
