import type { ListDistributionNetworksResultDto } from "@/application/dtos/DistributionNetworkDto";
import { ApplicationError } from "@/application/errors/ApplicationError";
import type { NetworkPort } from "@/application/ports/NetworkPort";
import type { NetworkModuleFacade } from "@/modules/network";

export function createNetworkPortAdapter(
  module: NetworkModuleFacade,
): NetworkPort {
  return {
    async listByCitycode(citycode) {
      try {
        const result = await module.listNetworksForCommune.execute(citycode);
        const dto: ListDistributionNetworksResultDto = {
          citycode: result.commune.citycode || citycode,
          city: result.commune.city,
          year: result.commune.year,
          confidence: result.confidence,
          networks: result.commune.networks,
          hiddenNonResidentialCount: result.commune.hiddenNonResidentialCount,
          selectedNetworkCode: null,
        };
        return dto;
      } catch (error) {
        throw new ApplicationError("NETWORKS_UNAVAILABLE", error);
      }
    },
  };
}
