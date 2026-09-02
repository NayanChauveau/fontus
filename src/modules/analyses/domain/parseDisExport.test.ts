import { describe, expect, it } from "vitest";
import { parseDisDate, parseDisExport } from "./parseDisExport";

const UDI_COM = `cdreseau;inseecommune;nomcommune
033001214;33063;BORDEAUX
016000262;16015;ANGOULEME
`;

const PLV = `cdreseau;referenceprel;dateprel;heureprel;conclusionprel;plvconformitebacterio;plvconformitechimique;inseecommuneprinc
033001214;P1;2026-06-18;11:40:00;Eau conforme;C;C;33063
033001214;P0;2024-01-01;00:00:00;Ancien;C;C;33063
016000262;P2;2026-06-30;13:59:00;Autre UDI;C;C;16015
033001214;;2026-06-18;11:40:00;Sans ref;C;C;33063
`;

const RESULT = `referenceprel;cdparametre;libmajparametre;cdparametreanl;cdcasparam;rqana;rsana;lbunite
P1;1340;Nitrates;NO3;;12,3;12.3;mg/L
P1;1339;Nitrites;NO2;;<0,01;0;mg/L
P1;1340;Nitrates;NO3;;99;99;mg/L
P2;1340;Nitrates;NO3;;8;8;mg/L
P0;1340;Nitrates;NO3;;1;1;mg/L
`;

describe("parseDisExport", () => {
  it("joins UDI_COM, PLV and RESULT for one network inside the window", () => {
    const samples = parseDisExport({
      udiCom: UDI_COM,
      plv: PLV,
      result: RESULT,
      networkCode: "33001214",
      dateMin: "2025-09-02",
    });

    expect(samples).toHaveLength(1);
    expect(samples[0]?.code).toBe("P1");
    expect(samples[0]?.udiCode).toBe("033001214");
    expect(samples[0]?.source).toBe("dis");
    expect(samples[0]?.communeInsee).toBe("33063");
    expect(samples[0]?.measurements).toHaveLength(2);
    expect(samples[0]?.measurements[0]).toMatchObject({
      parameterCode: "1340",
      rawText: "12,3",
      numericValue: 12.3,
      qualifier: "eq",
    });
    expect(samples[0]?.measurements[1]).toMatchObject({
      parameterCode: "1339",
      rawText: "<0,01",
      qualifier: "lt",
      numericValue: 0.01,
    });
  });

  it("reads comma-separated files and French dates", () => {
    const samples = parseDisExport({
      plv: `code_reseau,code_prelevement,date_prelevement,heure_prelevement,conclusion_conformite_prelevement,conformite_limites_bact_prelevement,conformite_limites_pc_prelevement
033001214,P3,18/06/2026,114000,ok,C,C
`,
      result: `code_prelevement,code_parametre,libelle_parametre,resultat_alphanumerique,libelle_unite
P3,1382,Plomb,"<0,5",µg/L
`,
      networkCode: "033001214",
    });

    expect(samples[0]?.sampledAt.toISOString()).toBe("2026-06-18T11:40:00.000Z");
    expect(samples[0]?.measurements[0]?.parameterLabel).toBe("Plomb");
  });

  it("uses the UDI_COM commune when the PLV row has none", () => {
    const samples = parseDisExport({
      udiCom: UDI_COM,
      plv: `cdreseau;referenceprel;dateprel
033001214;P4;20260618
`,
      result: `referenceprel;cdparametre;libmajparametre;rqana
P4;1340;Nitrates;8
`,
      networkCode: "033001214",
    });

    expect(samples[0]?.communeInsee).toBe("33063");
  });

  it("skips blank CSV rows and keeps a numeric-only result", () => {
    const samples = parseDisExport({
      plv: `\ufeffcdreseau;referenceprel;dateprel;heureprel
;;;
033001214;P6;2026-06-18;midi
`,
      result: `referenceprel;cdparametre;libmajparametre;rqana;rsana;lbunite
P6;1340;Nitrates;;8;mg/L
`,
      networkCode: "033001214",
    });

    expect(samples[0]?.sampledAt.toISOString()).toBe("2026-06-18T00:00:00.000Z");
    expect(samples[0]?.measurements[0]?.numericValue).toBe(8);
  });

  it("tolerates a short row and a non-numeric RESULT cell", () => {
    const samples = parseDisExport({
      plv: `cdreseau;referenceprel;dateprel;heureprel;extra
033001214;P7;2026-06-18
`,
      result: `referenceprel;cdparametre;libmajparametre;rqana;rsana
P7;1340;Nitrates;;n/a
`,
      networkCode: "033001214",
    });

    expect(samples[0]?.measurements[0]?.rawText).toBe("n/a");
    expect(samples[0]?.measurements[0]?.numericValue).toBeNull();
  });

  it("ignores UDI_COM and PLV rows without a network code", () => {
    expect(
      parseDisExport({
        udiCom: `cdreseau;inseecommune
;33063
`,
        plv: `cdreseau;referenceprel;dateprel
;P10;2026-06-18
`,
        result: `referenceprel;cdparametre;libmajparametre;rqana
P10;1340;Nitrates;1
`,
        networkCode: "033001214",
      }),
    ).toEqual([]);
  });

  it("skips empty tables and rows without a usable parameter", () => {
    expect(
      parseDisExport({
        plv: "",
        result: "",
        networkCode: "033001214",
      }),
    ).toEqual([]);
    expect(
      parseDisExport({
        plv: `cdreseau;referenceprel;dateprel\n033001214;P5;not-a-date\n`,
        result: `referenceprel;cdparametre;libmajparametre\nP5;1340;\n`,
        networkCode: "033001214",
      }),
    ).toEqual([]);
  });
});

describe("parseDisDate", () => {
  it("accepts compact and colon times", () => {
    expect(parseDisDate("2026-06-18", "13:59")?.toISOString()).toBe(
      "2026-06-18T13:59:00.000Z",
    );
    expect(parseDisDate("2026-06-18", "1140")?.toISOString()).toBe(
      "2026-06-18T11:40:00.000Z",
    );
    expect(parseDisDate(null, "12:00")).toBeNull();
    expect(parseDisDate("18-06-2026", null)).toBeNull();
    expect(parseDisDate("2026-13-40", null)).toBeNull();
  });
});
