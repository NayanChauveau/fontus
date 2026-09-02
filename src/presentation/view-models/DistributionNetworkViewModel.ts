export type NetworkConfidenceViewModel = "exact" | "ambiguous" | "none";

export type DistributionNetworkViewModel = {
  code: string;
  name: string;
  neighborhoodsLabel: string;
};

export type DistributionNetworksViewModel = {
  city: string;
  year: number;
  confidence: NetworkConfidenceViewModel;
  confidenceLabel: string;
  disclaimer: string;
  hiddenNote: string | null;
  networks: DistributionNetworkViewModel[];
  selectedNetworkCode: null;
};
