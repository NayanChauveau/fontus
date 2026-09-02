export type MeasurementQualifierDto = "eq" | "lt" | "gt";

export type MeasurementConversionDto =
  | "identity"
  | "converted"
  | "not_convertible"
  | "not_numeric";

export type MeasurementResolutionDto = {
  canonicalId: string;
  canonicalName: string;
  category: string;
  displayPriority: number;
  canonicalUnit: string | null;
  canonicalNumericValue: number | null;
  conversion: MeasurementConversionDto;
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

export type NetworkWaterQualityDto = {
  networkCode: string;
  windowFrom: string;
  source: "cache" | "remote";
  latestSample: AnalysisSampleDto | null;
  latestMeasurements: MeasurementDto[];
};
