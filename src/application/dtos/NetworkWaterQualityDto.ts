export type MeasurementQualifierDto = "eq" | "lt" | "gt";

export type MeasurementDto = {
  parameterCode: string;
  parameterLabel: string;
  rawText: string;
  numericValue: number | null;
  qualifier: MeasurementQualifierDto;
  unit: string | null;
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
};
