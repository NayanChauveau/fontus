import { describe, expect, it } from "vitest";
import { buildPriorityCards, cardIdFor } from "./buildPriorityCards";
import type { NetworkMeasurementViewModel } from "../view-models/NetworkAnalysesViewModel";

describe("buildPriorityCards", () => {
  it("always emits the seven families and sorts a PFAS card", () => {
    const cards = buildPriorityCards([
      measurement({ canonicalId: "pfoa", category: "pfas", parameterLabel: "PFOA" }),
      measurement({
        canonicalId: "pfba",
        category: "pfas",
        parameterLabel: "PFBA",
      }),
      measurement({
        canonicalId: "pfpea",
        category: "pfas",
        parameterLabel: "PFPeA",
      }),
      measurement({
        canonicalId: "pfas20",
        category: "pfas",
        parameterLabel: "Somme PFAS-20",
      }),
      measurement({
        canonicalId: "nitrates",
        category: "nutrients",
        parameterLabel: "Nitrates",
      }),
      measurement({
        canonicalId: "aluminium",
        category: "metals",
        parameterLabel: "Aluminium",
      }),
      measurement({
        canonicalId: "lead",
        category: "metals",
        parameterLabel: "Plomb",
      }),
      measurement({
        canonicalId: "arsenic",
        category: "metals",
        parameterLabel: "Arsenic",
      }),
      measurement({
        canonicalId: "hardness",
        category: "organoleptic",
        parameterLabel: "TH",
      }),
      measurement({
        canonicalId: "ecoli",
        category: "microbio",
        parameterLabel: "E. coli",
      }),
      measurement({
        canonicalId: "atrazine",
        category: "pesticides",
        parameterLabel: "Atrazine",
      }),
    ]);

    expect(cards.map((card) => card.id)).toEqual([
      "pfas",
      "nitrates",
      "pesticides",
      "lead",
      "arsenic",
      "microbio",
      "hardness",
    ]);
    expect(cards[0]?.measurements.map((row) => row.canonicalId)).toEqual([
      "pfas20",
      "pfoa",
      "pfba",
      "pfpea",
    ]);
    expect(cards.find((card) => card.id === "nitrates")?.empty).toBe(false);
    expect(cards.find((card) => card.id === "lead")?.empty).toBe(false);
    expect(cards.find((card) => card.id === "pesticides")?.measurements[0]?.canonicalId).toBe(
      "atrazine",
    );
    expect(cardIdFor({ canonicalId: "lead", category: "metals" })).toBe("lead");
    expect(cardIdFor({ canonicalId: "aluminium", category: "metals" })).toBeNull();
  });
});

function measurement(
  extras: Partial<NetworkMeasurementViewModel> &
    Pick<NetworkMeasurementViewModel, "canonicalId" | "category" | "parameterLabel">,
): NetworkMeasurementViewModel {
  return {
    parameterCode: extras.canonicalId ?? "x",
    canonicalName: extras.parameterLabel,
    originalLabel: null,
    valueLabel: "1",
    canonicalValueLabel: "1",
    converted: false,
    reconstructed: false,
    sampledAtLabel: "18 juin 2026",
    sourceLabel: "Hub’Eau",
    udiLabel: "033001214",
    unitLabel: "mg/L",
    emptyKind: null,
    priority: true,
    fr: null,
    eu: null,
    ch: null,
    us: null,
    who: null,
    strict: null,
    ...extras,
  };
}
