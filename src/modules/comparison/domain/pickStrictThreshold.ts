import type { ThresholdVersion } from "@/modules/norms";
import { convertUnit } from "@/modules/parameters";

export const STRICT_REFERENCE_CITATION =
  "Référence stricte du site : plus basse limite légale comparable parmi FR, UE, CH et US. Ce n’est pas une norme officielle.";

const CANONICAL_UNIT = "mg/L";

export function pickStrictThreshold(
  candidates: ReadonlyArray<ThresholdVersion | null>,
): ThresholdVersion | null {
  const eligible = candidates.flatMap((threshold) => {
    if (!isComparableLegalMax(threshold)) {
      return [];
    }
    const converted = convertUnit(threshold.value, threshold.unit, CANONICAL_UNIT);
    if (converted.value === null) {
      return [];
    }
    return [{ threshold, canonicalValue: converted.value }];
  });
  if (eligible.length === 0) {
    return null;
  }

  return eligible.reduce((lowest, current) =>
    current.canonicalValue < lowest.canonicalValue ? current : lowest,
  ).threshold;
}

function isComparableLegalMax(
  threshold: ThresholdVersion | null,
): threshold is ThresholdVersion {
  return (
    threshold !== null &&
    threshold.kind === "legal_limit" &&
    threshold.binding &&
    threshold.operator === "lte" &&
    Number.isFinite(threshold.value)
  );
}
