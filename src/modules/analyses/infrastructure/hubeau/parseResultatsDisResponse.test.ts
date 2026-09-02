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
});
