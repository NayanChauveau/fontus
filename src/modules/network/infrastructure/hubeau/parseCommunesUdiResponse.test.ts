import { describe, expect, it } from "vitest";
import { parseCommunesUdiResponse } from "./parseCommunesUdiResponse";

describe("parseCommunesUdiResponse", () => {
  it("maps a Hub’Eau communes_udi page", () => {
    const parsed = parseCommunesUdiResponse({
      count: 1,
      next: null,
      data: [
        {
          code_commune: "33063",
          nom_commune: "Bordeaux",
          nom_quartier: "Ouest",
          code_reseau: "033001174",
          nom_reseau: "CAP ROUX",
          debut_alim: "2010-10-15",
          annee: "2026",
        },
      ],
    });

    expect(parsed.next).toBeNull();
    expect(parsed.links).toEqual([
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
  });

  it("drops rows without a network code", () => {
    expect(
      parseCommunesUdiResponse({
        data: [{ code_commune: "33063", nom_commune: "Bordeaux" }],
      }).links,
    ).toEqual([]);
  });

  it("accepts a numeric year and ignores invalid rows", () => {
    const parsed = parseCommunesUdiResponse({
      next: 1,
      data: [
        null,
        {
          code_commune: "33063",
          nom_commune: "Bordeaux",
          code_reseau: "033001174",
          nom_reseau: "CAP ROUX",
          annee: 2026,
        },
      ],
    });
    expect(parsed.next).toBeNull();
    expect(parsed.links[0]?.year).toBe(2026);
    expect(parseCommunesUdiResponse(null).links).toEqual([]);
    expect(parseCommunesUdiResponse({ data: "nope" }).links).toEqual([]);
  });
});
