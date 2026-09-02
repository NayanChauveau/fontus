import {
  isAddressQueryTooShort,
  normalizeAddressQuery,
} from "../addressQuery";
import type { ResolveAddressResultDto } from "../dtos/AddressDto";
import type { ApplicationPorts } from "../ports/ApplicationPorts";

export class ResolveAddressUseCase {
  constructor(private readonly ports: ApplicationPorts) {}

  async execute(input: {
    id: string;
    label: string;
  }): Promise<ResolveAddressResultDto> {
    const id = input.id.trim();
    const label = normalizeAddressQuery(input.label);

    if (!id || isAddressQueryTooShort(label)) {
      return { address: null };
    }

    const address = await this.ports.geocoding.resolve({ id, label });
    return { address };
  }
}
