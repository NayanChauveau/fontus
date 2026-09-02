import type { ThresholdVersion } from "../../norms/domain/ThresholdVersion";

export const STRICT_REFERENCE_CITATION =
  "Référence stricte du site : plus basse limite légale comparable parmi FR, UE, CH et US. Ce n’est pas une norme officielle.";

export function pickStrictThreshold(
  candidates: ReadonlyArray<ThresholdVersion | null>,
): ThresholdVersion | null {
  const eligible = candidates.filter(isComparableLegalMax);
  if (eligible.length === 0) {
    return null;
  }

  const unit = eligible[0]!.unit;
  const comparable = eligible.filter((threshold) => threshold.unit === unit);
  return comparable.reduce((lowest, current) =>
    current.value < lowest.value ? current : lowest,
  );
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
