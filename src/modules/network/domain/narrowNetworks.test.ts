import { describe, expect, it } from "vitest";
import type { DistributionNetwork } from "./DistributionNetwork";
import {
  isNonResidentialNetwork,
  narrowNetworksForAddress,
} from "./narrowNetworks";

const marseille: DistributionNetwork[] = [
  {
    code: "013006573",
    name: "GRAND PORT MARITIME MARSEILLE EST SEM 11",
    neighborhoods: ["port maritime"],
  },
  {
    code: "013000577",
    name: "MARSEILLE SAINTE-MARTHE",
    neighborhoods: ["MARSEILLE CENTRE ET SUD"],
  },
  {
    code: "013000521",
    name: "MARSEILLE ST BARNABE",
    neighborhoods: ["MARSEILLE EST"],
  },
  {
    code: "013000519",
    name: "MARSEILLE VALLON D'OL",
    neighborhoods: ["MARSEILLE NORD"],
  },
];

describe("isNonResidentialNetwork", () => {
  it("flags Grand Port Maritime UDIs", () => {
    expect(isNonResidentialNetwork(marseille[0]!)).toBe(true);
    expect(isNonResidentialNetwork(marseille[1]!)).toBe(false);
  });
});

describe("narrowNetworksForAddress", () => {
  it("keeps only the urban Marseille networks", () => {
    const narrowed = narrowNetworksForAddress(marseille);

    expect(narrowed.hiddenCount).toBe(1);
    expect(narrowed.networks.map((network) => network.code)).toEqual([
      "013000577",
      "013000521",
      "013000519",
    ]);
  });

  it("does not invent a unique UDI — Marseille stays a list", () => {
    expect(narrowNetworksForAddress(marseille).networks.length).toBeGreaterThan(
      1,
    );
  });

  it("keeps the original list when every UDI is non-residential", () => {
    const ports = marseille.slice(0, 1);
    expect(narrowNetworksForAddress(ports)).toEqual({
      networks: ports,
      hiddenCount: 0,
    });
  });
});
