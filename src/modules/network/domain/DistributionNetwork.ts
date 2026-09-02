export type RawUdiLink = {
  citycode: string;
  city: string;
  networkCode: string;
  networkName: string;
  neighborhood: string | null;
  year: number;
  supplyStartedOn: string | null;
};

export type DistributionNetwork = {
  code: string;
  name: string;
  neighborhoods: string[];
};

export type CommuneNetworks = {
  citycode: string;
  city: string;
  year: number;
  networks: DistributionNetwork[];
  hiddenNonResidentialCount: number;
};
