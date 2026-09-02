import { describe, expect, it } from "vitest";
import {
  createParameterCatalog,
  createUnlistedParameter,
} from "../../domain/createParameterCatalog";
import { PRIORITY_PARAMETERS } from "../../domain/priorityCatalog";
import type { ParameterCatalogPort } from "../ports/ParameterCatalogPort";
import { ResolveMeasurements } from "./ResolveMeasurements";

describe("ResolveMeasurements", () => {
  it("gives the same canonical id to two labels of nitrates and converts mg/L to µg/L for aluminium", async () => {
    const persisted: string[] = [];
    const useCase = new ResolveMeasurements(
      createParameterCatalog(PRIORITY_PARAMETERS),
      memoryStore(persisted),
    );

    const result = await useCase.execute([
      {
        parameterCode: "1340",
        parameterLabel: "Nitrates (en NO3)",
        rawText: "12,3",
        numericValue: 12.3,
        qualifier: "eq",
        unit: "mg/L",
      },
      {
        parameterCode: "other",
        parameterLabel: "Nitrates",
        siseCode: "NO3",
        rawText: "12,3",
        numericValue: 12.3,
        qualifier: "eq",
        unit: "mg/L",
      },
      {
        parameterCode: "1370",
        parameterLabel: "Aluminium total µg/l",
        siseCode: "ALTMICR",
        rawText: "0,005",
        numericValue: 0.005,
        qualifier: "eq",
        unit: "mg/L",
        sampledAt: "2026-05-18T11:55:00.000Z",
      },
      {
        parameterCode: "9999",
        parameterLabel: "Paramètre inconnu",
        rawText: "1",
        numericValue: 1,
        qualifier: "eq",
        unit: "mg/L",
      },
    ]);

    const nitrates = result.filter(
      (row) => row.resolution?.canonicalId === "nitrates",
    );
    const aluminium = result.find((row) => row.parameterCode === "1370");
    const unlisted = result.find((row) => row.parameterCode === "9999");

    expect(nitrates).toHaveLength(2);
    expect(aluminium?.resolution?.canonicalNumericValue).toBe(5);
    expect(aluminium?.resolution?.conversion).toBe("converted");
    expect(aluminium?.sampledAt).toBe("2026-05-18T11:55:00.000Z");
    expect(unlisted?.resolution?.canonicalId).toBe("unlisted:9999");
    expect(unlisted?.resolution?.displayPriority).toBe(1000);
    expect(result[0]?.resolution?.canonicalId).toBe("nitrates");
    expect(persisted).toContain("unlisted:9999");
  });

  it("hydrates imported aliases and survives a store failure", async () => {
    const imported = createUnlistedParameter({
      code: "8888",
      label: "Vu",
      unit: "mg/L",
    });
    imported.aliases.push({ source: "cas", externalCode: "cas-8888", label: "Vu" });

    const useCase = new ResolveMeasurements(
      createParameterCatalog(PRIORITY_PARAMETERS),
      {
        async persist() {},
        async listImported() {
          return [imported, PRIORITY_PARAMETERS[0]!];
        },
        async listSeenCodes() {
          return [{ code: "8888", label: "Vu", unit: "mg/L" }];
        },
      },
    );

    const first = await useCase.execute([
      {
        parameterCode: "x",
        parameterLabel: "Vu",
        casCode: "cas-8888",
        rawText: "1",
        numericValue: 1,
        qualifier: "eq",
        unit: "mg/L",
      },
    ]);
    expect(first[0]?.resolution?.canonicalId).toBe("unlisted:8888");

    const failing = new ResolveMeasurements(
      createParameterCatalog(PRIORITY_PARAMETERS),
      {
        async persist() {
          throw new Error("db");
        },
        async listImported() {
          throw new Error("db");
        },
        async listSeenCodes() {
          return [];
        },
      },
    );
    const resolved = await failing.execute([
      {
        parameterCode: "7777",
        parameterLabel: "Y",
        rawText: "1",
        numericValue: 1,
        qualifier: "eq",
        unit: "mg/L",
      },
    ]);
    expect(resolved[0]?.resolution?.canonicalId).toBe("unlisted:7777");
  });

  it("reuses a hydrated catalog and keeps a null resolution when add is a no-op", async () => {
    const catalog = createParameterCatalog(PRIORITY_PARAMETERS);
    const useCase = new ResolveMeasurements(catalog, memoryStore([]));

    await useCase.execute([
      {
        parameterCode: "1340",
        parameterLabel: "Nitrates",
        rawText: "1",
        numericValue: 1,
        qualifier: "eq",
        unit: "mg/L",
      },
    ]);
    const again = await useCase.execute([
      {
        parameterCode: "1340",
        parameterLabel: "Nitrates",
        rawText: "2",
        numericValue: 2,
        qualifier: "eq",
        unit: "mg/L",
      },
    ]);
    expect(again[0]?.resolution?.canonicalId).toBe("nitrates");

    const opaque = {
      findByExternalCode() {
        return null;
      },
      add() {},
      list() {
        return catalog.list();
      },
    };
    const unresolved = new ResolveMeasurements(opaque, {
      async persist() {},
      async listImported() {
        return [];
      },
      async listSeenCodes() {
        return [];
      },
    });
    const missing = await unresolved.execute([
      {
        parameterCode: "ghost",
        parameterLabel: "Fantôme",
        rawText: "1",
        numericValue: 1,
        qualifier: "eq",
        unit: "mg/L",
      },
    ]);
    expect(missing[0]?.resolution).toBeNull();
  });

  it("sorts an unresolved row after known parameters and skips known imports", async () => {
    const useCase = new ResolveMeasurements(
      {
        findByExternalCode() {
          return null;
        },
        add() {},
        list() {
          return [];
        },
      },
      {
        async persist() {},
        async listImported() {
          return [
            createUnlistedParameter({ code: "already", label: "Déjà", unit: "mg/L" }),
            { ...createUnlistedParameter({ code: "no-alias", label: "Vide", unit: null }), aliases: [] },
          ];
        },
        async listSeenCodes() {
          return [];
        },
      },
    );

    const result = await useCase.execute([
      {
        parameterCode: "ghost-a",
        parameterLabel: "Zêta",
        rawText: "1",
        numericValue: 1,
        qualifier: "eq",
        unit: "mg/L",
      },
      {
        parameterCode: "1340",
        parameterLabel: "Nitrates",
        rawText: "1",
        numericValue: 1,
        qualifier: "eq",
        unit: "mg/L",
      },
    ]);

    expect(result.every((row) => row.resolution === null)).toBe(true);
    expect(result.map((row) => row.parameterLabel)).toEqual(["Nitrates", "Zêta"]);
  });

  it("reconstructs a qualitative PFAS-20 sum after resolving the 20 members", async () => {
    const useCase = new ResolveMeasurements(
      createParameterCatalog(PRIORITY_PARAMETERS),
      memoryStore([]),
    );
    const sampledAt = "2026-06-30T11:59:00.000Z";
    const members = PRIORITY_PARAMETERS.filter(
      (parameter) => parameter.category === "pfas" && parameter.id !== "pfas20",
    ).map((parameter) => ({
      parameterCode: parameter.aliases[0]!.externalCode,
      parameterLabel: parameter.name,
      rawText: "<0,001",
      numericValue: 0.001,
      qualifier: "lt" as const,
      unit: "µg/L",
      sampledAt,
    }));

    const result = await useCase.execute([
      {
        parameterCode: "8847",
        parameterLabel: "Somme de 20 substances perfluoroalkylées (PFAS)",
        rawText: "<SEUIL",
        numericValue: null,
        qualifier: "lt",
        unit: "µg/L",
        sampledAt,
      },
      ...members,
    ]);

    const sum = result.find((row) => row.resolution?.canonicalId === "pfas20");
    expect(sum?.rawText).toBe("<0,02");
    expect(sum?.numericValue).toBe(0.02);
    expect(sum?.qualifier).toBe("lt");
    expect(sum?.resolution?.canonicalNumericValue).toBe(0.02);
    expect(sum?.resolution?.derived).toBe("reconstructed_sum");
  });

  it("reconstructs each PFAS-20 sample independently", async () => {
    const useCase = new ResolveMeasurements(
      createParameterCatalog(PRIORITY_PARAMETERS),
      memoryStore([]),
    );
    const first = "2025-04-23T14:35:00.000Z";
    const second = "2026-06-30T11:59:00.000Z";

    const result = await useCase.execute([
      ...pfas20Sample(first, 0.001),
      ...pfas20Sample(second, 0.002),
    ]);

    const sums = result.filter((row) => row.resolution?.canonicalId === "pfas20");
    expect(sums).toHaveLength(2);
    expect(sums.find((row) => row.sampledAt === first)?.rawText).toBe("<0,02");
    expect(sums.find((row) => row.sampledAt === second)?.rawText).toBe("<0,04");
    expect(sums.every((row) => row.resolution?.derived === "reconstructed_sum")).toBe(
      true,
    );
  });
});

function pfas20Sample(sampledAt: string, memberLq: number) {
  const members = PRIORITY_PARAMETERS.filter(
    (parameter) => parameter.category === "pfas" && parameter.id !== "pfas20",
  ).map((parameter) => ({
    parameterCode: parameter.aliases[0]!.externalCode,
    parameterLabel: parameter.name,
    rawText: `<${String(memberLq).replace(".", ",")}`,
    numericValue: memberLq,
    qualifier: "lt" as const,
    unit: "µg/L",
    sampledAt,
  }));

  return [
    {
      parameterCode: "8847",
      parameterLabel: "Somme de 20 substances perfluoroalkylées (PFAS)",
      rawText: "<SEUIL",
      numericValue: null,
      qualifier: "lt" as const,
      unit: "µg/L",
      sampledAt,
    },
    ...members,
  ];
}

function memoryStore(persisted: string[]): ParameterCatalogPort {
  return {
    async persist(parameter) {
      persisted.push(parameter.id);
    },
    async listImported() {
      return [];
    },
    async listSeenCodes() {
      return [];
    },
  };
}
