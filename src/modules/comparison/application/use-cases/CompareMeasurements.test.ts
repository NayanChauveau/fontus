import { describe, expect, it } from "vitest";
import { createNormCatalog } from "../../../norms/domain/createNormCatalog";
import { FR_EU_THRESHOLDS } from "../../../norms/domain/frEuCatalog";
import type { NormCatalogPort } from "../../../norms/application/ports/NormCatalogPort";
import { CompareMeasurements } from "./CompareMeasurements";

describe("CompareMeasurements", () => {
  it("compares FR and UE at the sampling date and hydrates twice without re-persisting", async () => {
    const persisted: string[] = [];
    const useCase = new CompareMeasurements(
      createNormCatalog(FR_EU_THRESHOLDS),
      memoryStore(persisted),
    );

    const first = await useCase.execute([
      {
        parameterId: "nitrates",
        canonicalNumericValue: 12.3,
        qualifier: "eq",
        conversion: "identity",
        sampledAt: "2026-06-18T11:40:00.000Z",
      },
      {
        parameterId: "pfoa",
        canonicalNumericValue: 0.001,
        qualifier: "eq",
        conversion: "identity",
        sampledAt: "2026-05-18T11:55:00.000Z",
      },
      {
        parameterId: "pfas20",
        canonicalNumericValue: 0.016,
        qualifier: "eq",
        conversion: "identity",
        sampledAt: "2026-05-18T11:55:00.000Z",
      },
    ]);

    expect(first[0]?.comparisons.fr?.status).toBe("compliant");
    expect(first[0]?.comparisons.fr?.kind).toBe("legal_limit");
    expect(first[0]?.comparisons.fr?.thresholdLabel).toBe("12,3 / 50 mg/L");
    expect(first[0]?.comparisons.eu?.status).toBe("compliant");
    expect(first[1]?.comparisons.fr?.status).toBe("no_threshold");
    expect(first[2]?.comparisons.fr?.status).toBe("compliant");
    expect(first[2]?.comparisons.fr?.thresholdLabel).toBe("0,016 / 0,1 µg/L");

    const before = persisted.length;
    await useCase.execute([]);
    expect(persisted.length).toBe(before);
  });

  it("survives a store failure and skips an invalid date", async () => {
    const useCase = new CompareMeasurements(createNormCatalog(FR_EU_THRESHOLDS), {
      async persist() {
        throw new Error("db");
      },
      async list() {
        throw new Error("db");
      },
    });

    const result = await useCase.execute([
      {
        parameterId: "nitrates",
        canonicalNumericValue: 12.3,
        qualifier: "eq",
        conversion: "identity",
        sampledAt: "not-a-date",
      },
      {
        parameterId: "aluminium",
        canonicalNumericValue: 5,
        qualifier: "eq",
        conversion: "converted",
      },
    ]);

    expect(result[0]?.comparisons.fr?.status).toBe("no_threshold");
    expect(result[1]?.comparisons.fr?.kind).toBe("quality_reference");
    expect(result[1]?.comparisons.fr?.binding).toBe(false);
  });

  it("imports extra versions from the store", async () => {
    const extra = {
      ...FR_EU_THRESHOLDS[0]!,
      id: "custom:fr",
      parameterId: "custom",
      value: 1,
    };
    const useCase = new CompareMeasurements(createNormCatalog(FR_EU_THRESHOLDS), {
      async persist() {},
      async list() {
        return [extra];
      },
    });

    const result = await useCase.execute([
      {
        parameterId: "custom",
        canonicalNumericValue: 0.5,
        qualifier: "eq",
        conversion: "identity",
        sampledAt: "2026-06-18T00:00:00.000Z",
      },
    ]);
    expect(result[0]?.comparisons.fr?.status).toBe("compliant");
  });

  it("formats a range without valueMax", async () => {
    const catalog = createNormCatalog([
      {
        id: "ph-open",
        parameterId: "ph-open",
        jurisdiction: "fr",
        unit: "unité pH",
        value: 6.5,
        valueMax: null,
        operator: "range",
        kind: "quality_reference",
        binding: false,
        validFrom: new Date("2007-01-11T00:00:00.000Z"),
        validTo: null,
        citation: "arrêté",
        sourceUrl: "https://example.test",
      },
    ]);
    const useCase = new CompareMeasurements(catalog, {
      async persist() {},
      async list() {
        return [];
      },
    });
    const result = await useCase.execute([
      {
        parameterId: "ph-open",
        canonicalNumericValue: 6.5,
        qualifier: "eq",
        conversion: "identity",
        sampledAt: "2026-06-18T00:00:00.000Z",
      },
    ]);
    expect(result[0]?.comparisons.fr?.thresholdLabel).toContain("6,5");
  });

  it("formats a minimum threshold", async () => {
    const catalog = createNormCatalog([
      {
        id: "hard-min",
        parameterId: "hard-min",
        jurisdiction: "fr",
        unit: "°f",
        value: 15,
        valueMax: null,
        operator: "gte",
        kind: "quality_reference",
        binding: false,
        validFrom: new Date("2007-01-11T00:00:00.000Z"),
        validTo: null,
        citation: "arrêté",
        sourceUrl: "https://example.test",
      },
    ]);
    const useCase = new CompareMeasurements(catalog, {
      async persist() {},
      async list() {
        return [];
      },
    });
    const result = await useCase.execute([
      {
        parameterId: "hard-min",
        canonicalNumericValue: 20,
        qualifier: "eq",
        conversion: "identity",
        sampledAt: "2026-06-18T00:00:00.000Z",
      },
    ]);
    expect(result[0]?.comparisons.fr?.thresholdLabel).toBe("20 / min. 15 °f");
  });

  it("shows measured vs limit, including a less-than result and a qualitative one", async () => {
    const useCase = new CompareMeasurements(
      createNormCatalog(FR_EU_THRESHOLDS),
      {
        async persist() {},
        async list() {
          return [];
        },
      },
    );

    const result = await useCase.execute([
      {
        parameterId: "nitrites",
        canonicalNumericValue: 0.01,
        qualifier: "lt",
        conversion: "identity",
        sampledAt: "2026-06-18T00:00:00.000Z",
      },
      {
        parameterId: "nitrates",
        canonicalNumericValue: 60,
        qualifier: "gt",
        conversion: "identity",
        sampledAt: "2026-06-18T00:00:00.000Z",
      },
      {
        parameterId: "pesticides_total",
        canonicalNumericValue: null,
        qualifier: "lt",
        conversion: "not_numeric",
        sampledAt: "2026-06-18T00:00:00.000Z",
      },
      {
        parameterId: "nitrates",
        canonicalNumericValue: Number.NaN,
        qualifier: "eq",
        conversion: "identity",
        sampledAt: "2026-06-18T00:00:00.000Z",
      },
    ]);

    expect(result[0]?.comparisons.fr?.thresholdLabel).toBe("< 0,01 / 0,5 mg/L");
    expect(result[1]?.comparisons.fr?.thresholdLabel).toBe("> 60 / 50 mg/L");
    expect(result[2]?.comparisons.fr?.status).toBe("not_comparable");
    expect(result[2]?.comparisons.fr?.thresholdLabel).toBe("0,5 µg/L");
    expect(result[3]?.comparisons.fr?.thresholdLabel).toBe("50 mg/L");
  });
});

function memoryStore(persisted: string[]): NormCatalogPort {
  return {
    async persist(version) {
      persisted.push(version.id);
    },
    async list() {
      return [];
    },
  };
}
