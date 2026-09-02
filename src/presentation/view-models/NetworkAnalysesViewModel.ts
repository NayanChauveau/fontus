export type NetworkMeasurementViewModel = {
  parameterCode: string;
  parameterLabel: string;
  valueLabel: string;
  sampledAtLabel: string;
  sourceLabel: string;
};

export type NetworkAnalysesViewModel = {
  networkCode: string;
  sampledAtLabel: string | null;
  conclusion: string | null;
  officialNote: string;
  sourceLabel: string;
  measurements: NetworkMeasurementViewModel[];
};
