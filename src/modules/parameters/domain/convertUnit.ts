import { isMassConcentrationUnit, normalizeUnit } from "./normalizeUnit";

export type UnitConversionStatus =
  | "identity"
  | "converted"
  | "not_convertible"
  | "not_numeric";

export type UnitConversion =
  | { status: "identity" | "converted"; value: number; unit: string | null }
  | { status: "not_convertible" | "not_numeric"; value: null; unit: string | null };

const TO_MG_L: Record<string, number> = {
  "ng/L": 0.000001,
  "µg/L": 0.001,
  "mg/L": 1,
  "g/L": 1000,
};

export function convertUnit(
  numericValue: number | null,
  fromUnit: string | null | undefined,
  toUnit: string | null | undefined,
): UnitConversion {
  const target = normalizeUnit(toUnit ?? null);

  if (numericValue === null || !Number.isFinite(numericValue)) {
    return { status: "not_numeric", value: null, unit: target };
  }

  const source = normalizeUnit(fromUnit ?? null);
  if (source === target) {
    return { status: "identity", value: numericValue, unit: target };
  }

  if (
    source &&
    target &&
    isMassConcentrationUnit(source) &&
    isMassConcentrationUnit(target)
  ) {
    return {
      status: "converted",
      value: (numericValue * TO_MG_L[source]) / TO_MG_L[target],
      unit: target,
    };
  }

  return { status: "not_convertible", value: null, unit: target };
}
