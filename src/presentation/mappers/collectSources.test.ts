import { describe, expect, it } from "vitest";
import { collectSources } from "./collectSources";
import type {
  ComparisonViewModel,
  NetworkMeasurementViewModel,
} from "../view-models/NetworkAnalysesViewModel";

describe("collectSources", () => {
  it("lists the measurement source first and dedupes threshold URLs", () => {
    const sources = collectSources(
      [
        measured({
          fr: comparison({
            citation: "Arrêté",
            sourceUrl: "https://www.legifrance.gouv.fr",
          }),
          eu: comparison({
            citation: "Directive",
            sourceUrl: "https://eur-lex.europa.eu",
          }),
          strict: comparison({
            citation: "Arrêté",
            sourceUrl: "https://www.legifrance.gouv.fr",
          }),
        }),
        measured({
          fr: comparison({
            citation: "Arrêté",
            sourceUrl: "https://www.legifrance.gouv.fr",
          }),
          ch: comparison({ citation: "OPBD", sourceUrl: null }),
          us: comparison({ citation: null, sourceUrl: null }),
        }),
      ],
      "Hub’Eau (SISE-Eaux), cache local",
    );

    expect(sources[0]).toMatchObject({
      kindLabel: "Mesures",
      label: "Hub’Eau (SISE-Eaux), cache local",
      href: "https://hubeau.eaufrance.fr/",
    });
    expect(sources.find((row) => row.label === "Arrêté")?.kindLabel).toBe(
      "FR, Stricte",
    );
    expect(sources.find((row) => row.label === "OPBD")?.href).toBeNull();
    expect(sources.some((row) => row.label === "Source du seuil")).toBe(false);
  });

  it("merges the same citation even when the URL differs", () => {
    const sources = collectSources(
      [
        measured({
          ch: comparison({
            citation: "OPBD, annexe 2",
            sourceUrl: "https://www.blv.admin.ch/fr/pfas-fr",
          }),
        }),
        measured({
          ch: comparison({
            citation: "OPBD, annexe 2",
            sourceUrl: "https://www.fedlex.admin.ch/eli/cc/2017/163/fr",
          }),
        }),
      ],
      "Hub’Eau",
    );

    const ch = sources.filter((row) => row.label === "OPBD, annexe 2");
    expect(ch).toHaveLength(1);
    expect(ch[0]?.kindLabel).toBe("CH");
    expect(ch[0]?.href).toBe("https://www.blv.admin.ch/fr/pfas-fr");
    expect(sources.map((row) => row.kindLabel)).toEqual(["Mesures", "CH"]);
  });

  it("fills a missing URL when the same citation appears later", () => {
    const sources = collectSources(
      [
        measured({
          ch: comparison({ citation: "OPBD", sourceUrl: null }),
        }),
        measured({
          ch: comparison({
            citation: "OPBD",
            sourceUrl: "https://www.fedlex.admin.ch/eli/cc/2017/163/fr",
          }),
        }),
      ],
      "Hub’Eau",
    );

    expect(sources.find((row) => row.label === "OPBD")?.href).toBe(
      "https://www.fedlex.admin.ch/eli/cc/2017/163/fr",
    );
  });

  it("keeps a URL without citation", () => {
    const sources = collectSources(
      [
        measured({
          eu: comparison({
            citation: null,
            sourceUrl: "https://example.test/seuil",
          }),
        }),
      ],
      "Hub’Eau",
    );

    expect(sources[1]).toMatchObject({
      label: "Source du seuil",
      href: "https://example.test/seuil",
      kindLabel: "UE",
    });
  });
});

function comparison(
  extras: Pick<ComparisonViewModel, "citation" | "sourceUrl">,
): ComparisonViewModel {
  return {
    status: "compliant",
    statusLabel: "conforme",
    thresholdLabel: "1",
    kindLabel: "limite légale",
    binding: true,
    siteMetric: false,
    ...extras,
  };
}

function measured(
  extras: Partial<NetworkMeasurementViewModel>,
): NetworkMeasurementViewModel {
  return {
    parameterCode: "1340",
    parameterLabel: "Nitrates",
    canonicalName: "Nitrates",
    canonicalId: "nitrates",
    category: "nutrients",
    originalLabel: null,
    valueLabel: "8 mg/L",
    canonicalValueLabel: "8 mg/L",
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
    strict: null,
    ...extras,
  };
}
