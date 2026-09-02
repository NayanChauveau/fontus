import { describe, expect, it } from "vitest";
import type { RawUdiLink } from "../../domain/DistributionNetwork";
import type { CachedCommuneNetworks } from "../ports/NetworkCachePort";
import { ListNetworksForCommune } from "./ListNetworksForCommune";

const bordeaux: RawUdiLink[] = [
  {
    citycode: "33063",
    city: "Bordeaux",
    networkCode: "033001174",
    networkName: "CAP ROUX",
    neighborhood: "Ouest",
    year: 2026,
    supplyStartedOn: "2010-10-15",
  },
  {
    citycode: "33063",
    city: "Bordeaux",
    networkCode: "033001214",
    networkName: "PAULIN",
    neighborhood: "Centre Nord, Rive Droite",
    year: 2026,
    supplyStartedOn: "2010-10-15",
  },
];

const arbanats: RawUdiLink[] = [
  {
    citycode: "33009",
    city: "Arbanats",
    networkCode: "033000432",
    networkName: "COBAS",
    neighborhood: "-",
    year: 2026,
    supplyStartedOn: null,
  },
];

function createMemoryCache(seed: CachedCommuneNetworks[] = []) {
  const store = new Map(
    seed.map((entry) => [`${entry.citycode}:${entry.year}`, entry] as const),
  );

  return {
    store,
    cache: {
      async read(citycode: string, year: number) {
        return store.get(`${citycode}:${year}`) ?? null;
      },
      async write(input: CachedCommuneNetworks) {
        store.set(`${input.citycode}:${input.year}`, input);
      },
    },
  };
}

describe("ListNetworksForCommune", () => {
  const now = () => new Date("2026-09-02T10:00:00.000Z");

  it("marks Bordeaux as ambiguous and does not pick a network", async () => {
    const { cache } = createMemoryCache();
    const useCase = new ListNetworksForCommune(
      {
        async listByCommune() {
          return bordeaux;
        },
      },
      cache,
      now,
    );

    const result = await useCase.execute("33063");

    expect(result.confidence).toBe("ambiguous");
    expect(result.source).toBe("remote");
    expect(result.commune.networks).toHaveLength(2);
  });

  it("marks a single-UDI commune as exact", async () => {
    const { cache } = createMemoryCache();
    const useCase = new ListNetworksForCommune(
      {
        async listByCommune() {
          return arbanats;
        },
      },
      cache,
      now,
    );

    const result = await useCase.execute("33009");

    expect(result.confidence).toBe("exact");
    expect(result.commune.networks).toEqual([
      { code: "033000432", name: "COBAS", neighborhoods: [] },
    ]);
  });

  it("serves a fresh cache without calling Hub’Eau", async () => {
    let gatewayCalls = 0;
    const { cache } = createMemoryCache([
      {
        citycode: "33063",
        city: "Bordeaux",
        year: 2026,
        links: bordeaux,
        fetchedAt: new Date("2026-09-01T10:00:00.000Z"),
      },
    ]);
    const useCase = new ListNetworksForCommune(
      {
        async listByCommune() {
          gatewayCalls += 1;
          return [];
        },
      },
      cache,
      now,
    );

    const result = await useCase.execute("33063");

    expect(gatewayCalls).toBe(0);
    expect(result.source).toBe("cache");
    expect(result.confidence).toBe("ambiguous");
  });

  it("falls back to the previous year when the current year is empty", async () => {
    const { cache, store } = createMemoryCache();
    const useCase = new ListNetworksForCommune(
      {
        async listByCommune(_citycode, year) {
          return year === 2025 ? bordeaux.map((link) => ({ ...link, year: 2025 })) : [];
        },
      },
      cache,
      now,
    );

    const result = await useCase.execute("33063");

    expect(result.commune.year).toBe(2025);
    expect(result.source).toBe("remote");
    expect(store.has("33063:2026")).toBe(false);
    expect(store.has("33063:2025")).toBe(true);
  });

  it("looks up Marseille via the commune INSEE, not the arrondissement", async () => {
    const requested: string[] = [];
    const { cache } = createMemoryCache();
    const useCase = new ListNetworksForCommune(
      {
        async listByCommune(citycode) {
          requested.push(citycode);
          return [
            {
              citycode: "13055",
              city: "Marseille",
              networkCode: "013000577",
              networkName: "MARSEILLE SAINTE-MARTHE",
              neighborhood: "MARSEILLE CENTRE ET SUD",
              year: 2026,
              supplyStartedOn: null,
            },
            {
              citycode: "13055",
              city: "Marseille",
              networkCode: "013000519",
              networkName: "MARSEILLE VALLON D'OL",
              neighborhood: "MARSEILLE NORD",
              year: 2026,
              supplyStartedOn: null,
            },
          ];
        },
      },
      cache,
      now,
    );

    const result = await useCase.execute("13204");

    expect(requested).toEqual(["13055"]);
    expect(result.confidence).toBe("ambiguous");
    expect(result.commune.networks.length).toBeGreaterThan(1);
  });

  it("hides Grand Port Maritime UDIs for a household address", async () => {
    const { cache } = createMemoryCache();
    const useCase = new ListNetworksForCommune(
      {
        async listByCommune() {
          return [
            {
              citycode: "13055",
              city: "Marseille",
              networkCode: "013006573",
              networkName: "GRAND PORT MARITIME MARSEILLE EST SEM 11",
              neighborhood: "port maritime",
              year: 2026,
              supplyStartedOn: null,
            },
            {
              citycode: "13055",
              city: "Marseille",
              networkCode: "013000577",
              networkName: "MARSEILLE SAINTE-MARTHE",
              neighborhood: "MARSEILLE CENTRE ET SUD",
              year: 2026,
              supplyStartedOn: null,
            },
            {
              citycode: "13055",
              city: "Marseille",
              networkCode: "013000521",
              networkName: "MARSEILLE ST BARNABE",
              neighborhood: "MARSEILLE EST",
              year: 2026,
              supplyStartedOn: null,
            },
          ];
        },
      },
      cache,
      now,
    );

    const result = await useCase.execute("13204");

    expect(result.commune.networks.map((network) => network.code)).toEqual([
      "013000577",
      "013000521",
    ]);
    expect(result.commune.hiddenNonResidentialCount).toBe(1);
    expect(result.confidence).toBe("ambiguous");
  });

  it("throws instead of returning an empty network list", async () => {
    const { cache } = createMemoryCache();
    const useCase = new ListNetworksForCommune(
      {
        async listByCommune() {
          return [];
        },
      },
      cache,
      now,
    );

    await expect(useCase.execute("99999")).rejects.toThrow(
      "NO_DISTRIBUTION_NETWORK",
    );
  });
});
