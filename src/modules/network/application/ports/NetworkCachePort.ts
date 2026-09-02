import type { RawUdiLink } from "../../domain/DistributionNetwork";

export type CachedCommuneNetworks = {
  citycode: string;
  city: string;
  year: number;
  links: RawUdiLink[];
  fetchedAt: Date;
};

export type NetworkCachePort = {
  read(
    citycode: string,
    year: number,
  ): Promise<CachedCommuneNetworks | null>;
  write(input: {
    citycode: string;
    city: string;
    year: number;
    links: RawUdiLink[];
    fetchedAt: Date;
  }): Promise<void>;
};
