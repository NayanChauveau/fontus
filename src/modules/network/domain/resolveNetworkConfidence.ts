import type { NetworkConfidence } from "./NetworkConfidence";

/**
 * An address never identifies a network. Confidence comes only from
 * how many UDIs serve the commune for the looked-up year.
 * `probable` is intentionally absent: matching BAN streets to `nom_quartier`
 * is too fragile (plan I2).
 */
export function resolveNetworkConfidence(
  udiCount: number,
  options: { becameUniqueAfterFilter?: boolean } = {},
): NetworkConfidence {
  if (udiCount <= 0) {
    return "none";
  }
  if (udiCount === 1 && !options.becameUniqueAfterFilter) {
    return "exact";
  }
  return "ambiguous";
}
