export type NetworkConfidenceDto = "exact" | "ambiguous" | "none";

export type DistributionNetworkDto = {
  code: string;
  name: string;
  neighborhoods: string[];
};

export type ListDistributionNetworksResultDto = {
  citycode: string;
  city: string;
  year: number;
  confidence: NetworkConfidenceDto;
  networks: DistributionNetworkDto[];
  hiddenNonResidentialCount: number;
  selectedNetworkCode: null;
  source: "cache" | "remote";
};
