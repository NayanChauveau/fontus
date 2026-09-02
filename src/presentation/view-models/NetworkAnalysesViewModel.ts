export type NetworkMeasurementViewModel = {
  parameterCode: string;
  parameterLabel: string;
  canonicalName: string | null;
  canonicalId: string | null;
  originalLabel: string | null;
  valueLabel: string;
  canonicalValueLabel: string | null;
  converted: boolean;
  sampledAtLabel: string;
  sourceLabel: string;
  priority: boolean;
};

export type NetworkAnalysesViewModel = {
  networkCode: string;
  sampledAtLabel: string | null;
  conclusion: string | null;
  officialNote: string;
  perParameterDateNote: string;
  sourceLabel: string;
  priorityMeasurements: NetworkMeasurementViewModel[];
  otherMeasurements: NetworkMeasurementViewModel[];
};
