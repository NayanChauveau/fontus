export type MeasurementQualifierDto = "eq" | "lt" | "gt";

export type MeasurementConversionDto =
  | "identity"
  | "converted"
  | "not_convertible"
  | "not_numeric";

export type ComparisonStatusDto =
  | "compliant"
  | "exceedance"
  | "below_loq"
  | "not_comparable"
  | "no_threshold";

export type ComparisonDto = {
  status: ComparisonStatusDto;
  kind: "legal_limit" | "quality_reference" | "site_metric" | null;
  binding: boolean;
  thresholdLabel: string | null;
  citation: string | null;
  sourceUrl: string | null;
};

export type MeasurementComparisonsDto = {
  fr: ComparisonDto | null;
  eu: ComparisonDto | null;
  ch: ComparisonDto | null;
  us: ComparisonDto | null;
  strict: ComparisonDto | null;
};

export type MeasurementResolutionDto = {
  canonicalId: string;
  canonicalName: string;
  category: string;
  displayPriority: number;
  canonicalUnit: string | null;
  canonicalNumericValue: number | null;
  conversion: MeasurementConversionDto;
  derived?: "reconstructed_sum" | null;
};

export type MeasurementDto = {
  parameterCode: string;
  parameterLabel: string;
  siseCode?: string | null;
  casCode?: string | null;
  rawText: string;
  numericValue: number | null;
  qualifier: MeasurementQualifierDto;
  unit: string | null;
  sampledAt?: string;
  resolution: MeasurementResolutionDto | null;
  comparisons?: MeasurementComparisonsDto;
};

export type AnalysisSampleDto = {
  code: string;
  sampledAt: string;
  conclusion: string | null;
  conformiteLimitesBact: string | null;
  conformiteLimitesPc: string | null;
  source: string;
  measurements: MeasurementDto[];
};

export type HistoryTrendDto =
  | "rising"
  | "falling"
  | "stable"
  | "insufficient";

export type HistoryWarningDto = "loq_changed";

export type ParameterHistoryDto = {
  canonicalId: string;
  canonicalName: string;
  unit: string | null;
  points: MeasurementDto[];
  min: number | null;
  max: number | null;
  median: number | null;
  count: number;
  trend: HistoryTrendDto;
  warnings: HistoryWarningDto[];
};

export type NetworkWaterQualityDto = {
  networkCode: string;
  windowFrom: string;
  source: "cache" | "remote" | "import";
  latestSample: AnalysisSampleDto | null;
  latestMeasurements: MeasurementDto[];
  historyMeasurements?: MeasurementDto[];
  parameterHistories?: ParameterHistoryDto[];
};
