import {
  isInseeCitycode,
  normalizeCitycode,
} from "../citycode";
import type { ListDistributionNetworksResultDto } from "../dtos/DistributionNetworkDto";
import type { ApplicationPorts } from "../ports/ApplicationPorts";

export class ListDistributionNetworksUseCase {
  constructor(private readonly ports: ApplicationPorts) {}

  async execute(citycode: string): Promise<ListDistributionNetworksResultDto> {
    if (!isInseeCitycode(citycode)) {
      return {
        citycode: "",
        city: "",
        year: 0,
        confidence: "none",
        networks: [],
        hiddenNonResidentialCount: 0,
        selectedNetworkCode: null,
        source: "cache",
      };
    }

    return this.ports.network.listByCitycode(normalizeCitycode(citycode));
  }
}
