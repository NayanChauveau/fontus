import { describe, expect, it } from "vitest";
import { en } from "../i18n/en";
import { mapDistributionNetworksDto } from "./mapDistributionNetworksDto";

describe("mapDistributionNetworksDto", () => {
  it("maps exact, ambiguous, none and hidden networks", () => {
    const exact = mapDistributionNetworksDto({
      citycode: "33009",
      city: "Arcachon",
      year: 2026,
      confidence: "exact",
      networks: [{ code: "1", name: "COBAS", neighborhoods: ["Centre"] }],
      hiddenNonResidentialCount: 0,
      selectedNetworkCode: null,
    });
    expect(exact.confidenceLabel).toContain("exacte");
    expect(exact.disclaimer).toContain("un seul");
    expect(exact.networks[0]?.neighborhoodsLabel).toBe("Centre");

    const ambiguous = mapDistributionNetworksDto({
      citycode: "33063",
      city: "Bordeaux",
      year: 2026,
      confidence: "ambiguous",
      networks: [{ code: "2", name: "Paulin", neighborhoods: [] }],
      hiddenNonResidentialCount: 3,
      selectedNetworkCode: null,
    });
    expect(ambiguous.confidenceLabel).toContain("ambiguë");
    expect(ambiguous.hiddenNote).toContain("3");
    expect(ambiguous.networks[0]?.neighborhoodsLabel).toContain("non précisé");

    const none = mapDistributionNetworksDto({
      citycode: "",
      city: "",
      year: 0,
      confidence: "none",
      networks: [],
      hiddenNonResidentialCount: 0,
      selectedNetworkCode: null,
    });
    expect(none.confidenceLabel).toContain("aucun");
    expect(none.disclaimer).toContain("Aucun réseau");
  });

  it("can map labels in english", () => {
    const mapped = mapDistributionNetworksDto(
      {
        citycode: "33063",
        city: "Bordeaux",
        year: 2026,
        confidence: "ambiguous",
        networks: [{ code: "2", name: "Paulin", neighborhoods: [] }],
        hiddenNonResidentialCount: 2,
        selectedNetworkCode: null,
      },
      en,
    );
    expect(mapped.confidenceLabel).toBe("ambiguous match");
    expect(mapped.networks[0]?.neighborhoodsLabel).toBe("District not specified");
    expect(mapped.hiddenNote).toContain("2");
  });
});
