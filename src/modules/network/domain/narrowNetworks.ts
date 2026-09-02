import type { DistributionNetwork } from "./DistributionNetwork";

const NON_RESIDENTIAL_PATTERN =
  /port maritime|grand port|gpmm|a[eé]roport|zone industrielle|\bzi\b/i;

export function isNonResidentialNetwork(
  network: DistributionNetwork,
): boolean {
  const haystack = `${network.name} ${network.neighborhoods.join(" ")}`;
  return NON_RESIDENTIAL_PATTERN.test(haystack);
}

/**
 * Drop port / airport / industrial UDIs for a household address.
 * If that would wipe the list, keep everything — never return empty.
 */
export function narrowNetworksForAddress(
  networks: DistributionNetwork[],
): { networks: DistributionNetwork[]; hiddenCount: number } {
  const residential = networks.filter(
    (network) => !isNonResidentialNetwork(network),
  );

  if (residential.length === 0) {
    return { networks, hiddenCount: 0 };
  }

  return {
    networks: residential,
    hiddenCount: networks.length - residential.length,
  };
}
