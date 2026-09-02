import { describe, expect, it } from "vitest";
import { groupUdiLinks, splitNeighborhoods } from "./groupUdiLinks";

describe("splitNeighborhoods", () => {
  it("splits Hub’Eau quartier lists and drops placeholders", () => {
    expect(splitNeighborhoods("Centre Nord, Rive Droite")).toEqual([
      "Centre Nord",
      "Rive Droite",
    ]);
    expect(splitNeighborhoods("-")).toEqual([]);
    expect(splitNeighborhoods(null)).toEqual([]);
  });
});

describe("groupUdiLinks", () => {
  it("deduplicates by network code and keeps quartiers", () => {
    const grouped = groupUdiLinks([
      {
        citycode: "33063",
        city: "Bordeaux",
        networkCode: "033001214",
        networkName: "PAULIN",
        neighborhood: "Centre Nord, Rive Droite",
        year: 2026,
        supplyStartedOn: "2010-10-15",
      },
      {
        citycode: "33063",
        city: "Bordeaux",
        networkCode: "033001174",
        networkName: "CAP ROUX",
        neighborhood: "Ouest",
        year: 2026,
        supplyStartedOn: "2010-10-15",
      },
    ]);

    expect(grouped?.networks.map((network) => network.code)).toEqual([
      "033001174",
      "033001214",
    ]);
    expect(grouped?.networks[1]?.neighborhoods).toEqual([
      "Centre Nord",
      "Rive Droite",
    ]);
  });

  it("returns null for an empty payload", () => {
    expect(groupUdiLinks([])).toBeNull();
  });
});
