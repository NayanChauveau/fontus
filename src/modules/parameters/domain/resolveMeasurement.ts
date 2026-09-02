import { convertUnit, type UnitConversionStatus } from "./convertUnit";
import type { CanonicalParameter } from "./Parameter";
import type { ParameterCatalog } from "./createParameterCatalog";

export type MeasurementToResolve = {
  parameterCode: string;
  parameterLabel: string;
  siseCode?: string | null;
  casCode?: string | null;
  numericValue: number | null;
  unit: string | null;
};

export type ResolvedMeasurement = {
  parameter: CanonicalParameter;
  conversion: UnitConversionStatus;
  canonicalUnit: string | null;
  canonicalNumericValue: number | null;
};

export function resolveMeasurement(
  catalog: ParameterCatalog,
  measurement: MeasurementToResolve,
): ResolvedMeasurement | null {
  const parameter =
    catalog.findByExternalCode(measurement.parameterCode) ??
    (measurement.siseCode
      ? catalog.findByExternalCode(measurement.siseCode)
      : null) ??
    (measurement.casCode
      ? catalog.findByExternalCode(measurement.casCode)
      : null);

  if (!parameter) {
    return null;
  }

  const converted = convertUnit(
    measurement.numericValue,
    measurement.unit,
    parameter.canonicalUnit,
  );

  return {
    parameter,
    conversion: converted.status,
    canonicalUnit: converted.unit,
    canonicalNumericValue: converted.value,
  };
}

export function compareResolvedPriority(
  left: { displayPriority: number; name: string },
  right: { displayPriority: number; name: string },
): number {
  if (left.displayPriority !== right.displayPriority) {
    return left.displayPriority - right.displayPriority;
  }
  return left.name.localeCompare(right.name, "fr");
}
