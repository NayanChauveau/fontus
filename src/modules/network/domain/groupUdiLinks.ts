import type {
  CommuneNetworks,
  DistributionNetwork,
  RawUdiLink,
} from "./DistributionNetwork";

export function splitNeighborhoods(raw: string | null): string[] {
  if (!raw) {
    return [];
  }

  return raw
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length > 0 && part !== "-");
}

export function groupUdiLinks(links: RawUdiLink[]): CommuneNetworks | null {
  if (links.length === 0) {
    return null;
  }

  const first = links[0];
  if (!first) {
    return null;
  }

  const byCode = new Map<string, DistributionNetwork>();

  for (const link of links) {
    const existing = byCode.get(link.networkCode) ?? {
      code: link.networkCode,
      name: link.networkName,
      neighborhoods: [],
    };

    for (const neighborhood of splitNeighborhoods(link.neighborhood)) {
      if (!existing.neighborhoods.includes(neighborhood)) {
        existing.neighborhoods.push(neighborhood);
      }
    }

    byCode.set(link.networkCode, existing);
  }

  return {
    citycode: first.citycode,
    city: first.city,
    year: first.year,
    networks: [...byCode.values()].sort((left, right) =>
      left.name.localeCompare(right.name, "fr"),
    ),
    hiddenNonResidentialCount: 0,
  };
}
