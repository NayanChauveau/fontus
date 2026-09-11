import type { ListDistributionNetworksResultDto } from "../dtos/DistributionNetworkDto";

export type NetworkLookupOptions = {
  refresh?: boolean;
};

export type NetworkPort = {
  listByCitycode(
    citycode: string,
    options?: NetworkLookupOptions,
  ): Promise<ListDistributionNetworksResultDto>;
};
