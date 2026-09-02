import { describe, expect, it } from "vitest";
import { parseResultatsDisResponse } from "./parseResultatsDisResponse";

describe("parseResultatsDisResponse", () => {
  it("keeps < LQ as text and ignores Hub’Eau numeric 0.0", () => {
    const parsed = parseResultatsDisResponse(
      {
        count: 1,
        next: null,
        data: [
          {
            code_prelevement: "03300277847",
            code_parametre: "1339",
            libelle_parametre: "Nitrites (en NO2)",
            resultat_alphanumerique: "<0,01",
            resultat_numerique: 0.0,
            libelle_unite: "mg/L",
            date_prelevement: "2026-06-18T11:40:00Z",
            conclusion_conformite_prelevement: "Eau d'alimentation conforme.",
            conformite_limites_bact_prelevement: "C",
            conformite_limites_pc_prelevement: "C",
            code_commune: "33063",
            reseaux: [{ code: "033000496", nom: "SAUSSETTE" }],
          },
        ],
      },
      "033001214",
    );

    expect(parsed.samples[0]?.udiCode).toBe("033001214");
    expect(parsed.samples[0]?.measurements[0]).toMatchObject({
      rawText: "<0,01",
      numericValue: 0.01,
      qualifier: "lt",
      unit: "mg/L",
    });
  });

  it("ignores invalid payloads and incomplete rows", () => {
    expect(parseResultatsDisResponse(null, "033001214")).toEqual({
      count: 0,
      next: null,
      samples: [],
    });
    expect(parseResultatsDisResponse({ data: [null, {}] }, "033001214").samples).toEqual(
      [],
    );
  });

  it("merges two parameters of the same sample and skips a duplicate code", () => {
    const parsed = parseResultatsDisResponse(
      {
        count: 3,
        next: "https://hubeau.example/next",
        data: [
          {
            code_prelevement: "s1",
            code_parametre: "1339",
            libelle_parametre: "Nitrites",
            resultat_alphanumerique: "<0,01",
            date_prelevement: "2026-06-18T11:40:00Z",
          },
          {
            code_prelevement: "s1",
            code_parametre: "1340",
            libelle_parametre: "Nitrates",
            resultat_alphanumerique: "6",
            date_prelevement: "2026-06-18T11:40:00Z",
          },
          {
            code_prelevement: "s1",
            code_parametre: "1339",
            libelle_parametre: "Nitrites",
            resultat_alphanumerique: "<0,01",
            date_prelevement: "2026-06-18T11:40:00Z",
          },
        ],
      },
      "033001214",
    );
    expect(parsed.next).toContain("next");
    expect(parsed.samples[0]?.measurements.map((m) => m.parameterCode)).toEqual([
      "1339",
      "1340",
    ]);
  });

  it("treats a non-array data field and an invalid date as empty", () => {
    expect(parseResultatsDisResponse({ data: "nope", count: "x" }, "033001214")).toEqual({
      count: 0,
      next: null,
      samples: [],
    });
    expect(
      parseResultatsDisResponse(
        {
          data: [
            {
              code_prelevement: "s1",
              code_parametre: "1339",
              libelle_parametre: "Nitrites",
              date_prelevement: "not-a-date",
            },
          ],
        },
        "033001214",
      ).samples,
    ).toEqual([]);
  });
});
