import type { ListDistributionNetworksResultDto } from "../dtos/DistributionNetworkDto";

export type NetworkPort = {
  listByCitycode(citycode: string): Promise<ListDistributionNetworksResultDto>;
};
