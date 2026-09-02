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
  category: string | null;
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

export type PriorityCardId =
  | "pfas"
  | "nitrates"
  | "pesticides"
  | "lead"
  | "arsenic"
  | "microbio"
  | "hardness";

export type PriorityCardViewModel = {
  id: PriorityCardId;
  title: string;
  empty: boolean;
  measurements: NetworkMeasurementViewModel[];
};

export type ParameterHistoryViewModel = {
  canonicalId: string;
  title: string;
  unit: string | null;
  statsLabel: string;
  trend: string;
  trendLabel: string;
  warningLabels: string[];
  points: Array<{
    sampledAtLabel: string;
    valueLabel: string;
    y: number | null;
  }>;
};

export type NetworkAnalysesViewModel = {
  networkCode: string;
  sampledAtLabel: string | null;
  conclusion: string | null;
  bannerTone: "ok" | "alert" | "neutral";
  limitesBactLabel: string | null;
  limitesPcLabel: string | null;
  officialNote: string;
  perParameterDateNote: string;
  reconstructedSumNote: string | null;
  disclaimer: string;
  sourceLabel: string;
  windowFromLabel: string | null;
  parameterHistories: ParameterHistoryViewModel[];
  priorityCards: PriorityCardViewModel[];
  priorityMeasurements: NetworkMeasurementViewModel[];
  otherMeasurements: NetworkMeasurementViewModel[];
};
