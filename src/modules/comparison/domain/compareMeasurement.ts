import type { ThresholdVersion } from "../../norms/domain/ThresholdVersion";

export type ComparisonStatus =
  | "compliant"
  | "exceedance"
  | "below_loq"
  | "not_comparable"
  | "no_threshold";

export type MeasurementToCompare = {
  parameterId: string | null;
  canonicalNumericValue: number | null;
  qualifier: "eq" | "lt" | "gt";
  conversion: "identity" | "converted" | "not_convertible" | "not_numeric" | null;
};

export type ComparisonResult = {
  status: ComparisonStatus;
  threshold: ThresholdVersion | null;
};

type Position = "below" | "within" | "above";

export function compareMeasurement(
  measurement: MeasurementToCompare,
  threshold: ThresholdVersion | null,
): ComparisonResult {
  if (!measurement.parameterId || !threshold) {
    return { status: "no_threshold", threshold };
  }

  if (
    measurement.conversion === "not_convertible" ||
    measurement.conversion === "not_numeric" ||
    measurement.canonicalNumericValue === null ||
    !Number.isFinite(measurement.canonicalNumericValue)
  ) {
    return { status: "not_comparable", threshold };
  }

  const value = measurement.canonicalNumericValue;

  if (measurement.qualifier === "lt") {
    return { status: statusForLessThan(value, threshold), threshold };
  }
  if (measurement.qualifier === "gt") {
    return { status: statusForGreaterThan(value, threshold), threshold };
  }

  return {
    status: position(value, threshold) === "within" ? "compliant" : "exceedance",
    threshold,
  };
}

function statusForLessThan(
  loq: number,
  threshold: ThresholdVersion,
): ComparisonStatus {
  const where = position(loq, threshold);
  if (threshold.operator === "lte") {
    return where === "above" ? "below_loq" : "compliant";
  }
  if (where === "below") {
    return "exceedance";
  }
  return "below_loq";
}

function statusForGreaterThan(
  floor: number,
  threshold: ThresholdVersion,
): ComparisonStatus {
  if (threshold.operator === "lte") {
    return floor >= threshold.value ? "exceedance" : "not_comparable";
  }
  if (threshold.operator === "gte") {
    return floor >= threshold.value ? "compliant" : "not_comparable";
  }
  const max = threshold.valueMax ?? threshold.value;
  return floor >= max ? "exceedance" : "not_comparable";
}

function position(value: number, threshold: ThresholdVersion): Position {
  if (threshold.operator === "lte") {
    return value <= threshold.value ? "within" : "above";
  }
  if (threshold.operator === "gte") {
    return value >= threshold.value ? "within" : "below";
  }
  const max = threshold.valueMax ?? threshold.value;
  if (value < threshold.value) {
    return "below";
  }
  if (value > max) {
    return "above";
  }
  return "within";
}
