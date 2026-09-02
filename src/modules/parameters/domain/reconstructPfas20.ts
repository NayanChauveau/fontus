import { PFAS20_ID, PFAS20_MEMBER_IDS } from "./priorityCatalog";
import type { UnitConversionStatus } from "./convertUnit";

export type Pfas20Derivation = "reconstructed_sum";

export type ReconstructableResolution = {
  canonicalId: string;
  canonicalNumericValue: number | null;
  conversion: UnitConversionStatus;
  derived?: Pfas20Derivation | null;
};

export type ReconstructableMeasurement = {
  qualifier: "eq" | "lt" | "gt";
  rawText: string;
  numericValue: number | null;
  sampledAt?: string;
  resolution: ReconstructableResolution | null;
};

/**
 * Hub’Eau often publishes PFAS-20 as `<SEUIL` (no number). That is not an LQ
 * and cannot be compared to a stricter limit (CH, US…). When the 20 members
 * of the same sample are numeric, replace it with an upper bound
 * (LQ if `<`, measured value if `=`).
 */
export function reconstructPfas20<T extends ReconstructableMeasurement>(
  measurements: T[],
): T[] {
  return measurements.map((measurement) => {
    if (measurement.resolution?.canonicalId !== PFAS20_ID) {
      return measurement;
    }
    if (
      measurement.resolution.canonicalNumericValue !== null &&
      Number.isFinite(measurement.resolution.canonicalNumericValue)
    ) {
      return measurement;
    }

    const reconstructed = sumMembers(measurements, measurement.sampledAt);
    if (!reconstructed) {
      return measurement;
    }

    return {
      ...measurement,
      rawText: reconstructed.rawText,
      numericValue: reconstructed.value,
      qualifier: reconstructed.qualifier,
      resolution: {
        ...measurement.resolution,
        canonicalNumericValue: reconstructed.value,
        conversion: "identity",
        derived: "reconstructed_sum",
      },
    };
  });
}

function sumMembers(
  measurements: ReconstructableMeasurement[],
  sampledAt: string | undefined,
): { value: number; qualifier: "eq" | "lt"; rawText: string } | null {
  if (!sampledAt) {
    return null;
  }

  const byId = new Map<string, ReconstructableMeasurement>();
  for (const measurement of measurements) {
    const id = measurement.resolution?.canonicalId;
    if (
      !id ||
      !PFAS20_MEMBER_IDS.includes(id) ||
      measurement.sampledAt !== sampledAt
    ) {
      continue;
    }
    byId.set(id, measurement);
  }

  if (byId.size !== PFAS20_MEMBER_IDS.length) {
    return null;
  }

  let value = 0;
  let anyLessThan = false;
  for (const id of PFAS20_MEMBER_IDS) {
    const member = byId.get(id);
    const numeric = member?.resolution?.canonicalNumericValue;
    if (
      !member ||
      member.qualifier === "gt" ||
      numeric == null ||
      !Number.isFinite(numeric) ||
      member.resolution?.conversion === "not_numeric" ||
      member.resolution?.conversion === "not_convertible"
    ) {
      return null;
    }
    value += numeric;
    if (member.qualifier === "lt") {
      anyLessThan = true;
    }
  }

  const rounded = Number(value.toFixed(6));
  const qualifier = anyLessThan ? "lt" : "eq";
  return {
    value: rounded,
    qualifier,
    rawText: formatRaw(rounded, qualifier),
  };
}

function formatRaw(value: number, qualifier: "eq" | "lt"): string {
  const formatted = new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 6,
  }).format(value);
  return qualifier === "lt" ? `<${formatted}` : formatted;
}
