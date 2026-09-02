export type ComparisonViewModel = {
  status: string;
  statusLabel: string;
  thresholdLabel: string | null;
  kindLabel: string | null;
  citation: string | null;
  sourceUrl: string | null;
  binding: boolean;
  siteMetric: boolean;
};

export type NetworkMeasurementViewModel = {
  parameterCode: string;
  parameterLabel: string;
  canonicalName: string | null;
  canonicalId: string | null;
  originalLabel: string | null;
  valueLabel: string;
  canonicalValueLabel: string | null;
  converted: boolean;
  reconstructed: boolean;
  sampledAtLabel: string;
  sourceLabel: string;
  priority: boolean;
  fr: ComparisonViewModel | null;
  eu: ComparisonViewModel | null;
  ch: ComparisonViewModel | null;
  us: ComparisonViewModel | null;
  strict: ComparisonViewModel | null;
};

export type NetworkAnalysesViewModel = {
  networkCode: string;
  sampledAtLabel: string | null;
  conclusion: string | null;
  officialNote: string;
  perParameterDateNote: string;
  reconstructedSumNote: string | null;
  sourceLabel: string;
  priorityMeasurements: NetworkMeasurementViewModel[];
  otherMeasurements: NetworkMeasurementViewModel[];
};
