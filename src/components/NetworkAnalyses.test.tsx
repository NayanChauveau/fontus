/** @vitest-environment happy-dom */

import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { setStoredLocale } from "@/presentation/i18n/locale";
import { NetworkAnalyses } from "./NetworkAnalyses";

describe("NetworkAnalyses", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    window.localStorage.clear();
    document.documentElement.lang = "fr";
  });

  it("shows the official conclusion and both measurement groups", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({
          networkCode: "033001214",
          windowFrom: "2025-09-02",
          source: "cache",
          latestSample: {
            code: "s1",
            sampledAt: "2026-06-18T11:40:00.000Z",
            conclusion: "Eau conforme",
            conformiteLimitesBact: "C",
            conformiteLimitesPc: "C",
            source: "hubeau",
            measurements: [],
          },
          parameterHistories: [
            {
              canonicalId: "nitrates",
              canonicalName: "Nitrates",
              unit: "mg/L",
              min: 6,
              max: 12,
              median: 8,
              count: 3,
              trend: "stable",
              warnings: ["loq_changed"],
              points: [
                {
                  parameterCode: "1340",
                  parameterLabel: "Nitrates",
                  rawText: "6",
                  numericValue: 6,
                  qualifier: "eq",
                  unit: "mg/L",
                  sampledAt: "2026-01-01T00:00:00.000Z",
                  resolution: {
                    canonicalId: "nitrates",
                    canonicalName: "Nitrates",
                    category: "nutrients",
                    displayPriority: 20,
                    canonicalUnit: "mg/L",
                    canonicalNumericValue: 6,
                    conversion: "identity",
                  },
                },
                {
                  parameterCode: "1340",
                  parameterLabel: "Nitrates",
                  rawText: "12",
                  numericValue: 12,
                  qualifier: "eq",
                  unit: "mg/L",
                  sampledAt: "2026-06-01T00:00:00.000Z",
                  resolution: {
                    canonicalId: "nitrates",
                    canonicalName: "Nitrates",
                    category: "nutrients",
                    displayPriority: 20,
                    canonicalUnit: "mg/L",
                    canonicalNumericValue: 12,
                    conversion: "identity",
                  },
                },
              ],
            },
            {
              canonicalId: "pfas20",
              canonicalName: "Somme PFAS-20",
              unit: "µg/L",
              min: 0.01,
              max: 0.01,
              median: 0.01,
              count: 2,
              trend: "insufficient",
              warnings: [],
              points: [
                {
                  parameterCode: "8847",
                  parameterLabel: "Somme PFAS-20",
                  rawText: "0,01",
                  numericValue: 0.01,
                  qualifier: "eq",
                  unit: "µg/L",
                  sampledAt: "2026-01-01T00:00:00.000Z",
                  resolution: {
                    canonicalId: "pfas20",
                    canonicalName: "Somme PFAS-20",
                    category: "pfas",
                    displayPriority: 12,
                    canonicalUnit: "µg/L",
                    canonicalNumericValue: 0.01,
                    conversion: "identity",
                  },
                },
                {
                  parameterCode: "8847",
                  parameterLabel: "Somme PFAS-20",
                  rawText: "0,01",
                  numericValue: 0.01,
                  qualifier: "eq",
                  unit: "µg/L",
                  sampledAt: "2026-06-01T00:00:00.000Z",
                  resolution: {
                    canonicalId: "pfas20",
                    canonicalName: "Somme PFAS-20",
                    category: "pfas",
                    displayPriority: 12,
                    canonicalUnit: "µg/L",
                    canonicalNumericValue: 0.01,
                    conversion: "identity",
                  },
                },
              ],
            },
            {
              canonicalId: "lead",
              canonicalName: "Plomb",
              unit: "µg/L",
              min: 0.5,
              max: 0.5,
              median: 0.5,
              count: 1,
              trend: "insufficient",
              warnings: [],
              points: [
                {
                  parameterCode: "1382",
                  parameterLabel: "Plomb",
                  rawText: "<0,5",
                  numericValue: 0.5,
                  qualifier: "lt",
                  unit: "µg/L",
                  sampledAt: "2026-05-18T11:55:00.000Z",
                  resolution: {
                    canonicalId: "lead",
                    canonicalName: "Plomb",
                    category: "metals",
                    displayPriority: 30,
                    canonicalUnit: "µg/L",
                    canonicalNumericValue: 0.5,
                    conversion: "identity",
                  },
                },
              ],
            },
          ],
          latestMeasurements: [
            {
              parameterCode: "8847",
              parameterLabel: "Somme PFAS-20",
              rawText: "<0,034",
              numericValue: 0.034,
              qualifier: "lt",
              unit: "µg/L",
              sampledAt: "2026-05-18T11:55:00.000Z",
              resolution: {
                canonicalId: "pfas20",
                canonicalName: "Somme PFAS-20",
                category: "pfas",
                displayPriority: 12,
                canonicalUnit: "µg/L",
                canonicalNumericValue: 0.034,
                conversion: "identity",
                derived: "reconstructed_sum",
              },
              comparisons: {
                fr: {
                  status: "compliant",
                  kind: "legal_limit",
                  binding: true,
                  thresholdLabel: "< 0,034 / 0,1 µg/L",
                  citation: "Arrêté du 30 décembre 2022",
                  sourceUrl: "https://www.legifrance.gouv.fr",
                },
                eu: {
                  status: "compliant",
                  kind: "legal_limit",
                  binding: true,
                  thresholdLabel: "< 0,034 / 0,1 µg/L",
                  citation: "Directive (UE) 2020/2184",
                  sourceUrl: "https://eur-lex.europa.eu",
                },
                ch: {
                  status: "no_threshold",
                  kind: null,
                  binding: false,
                  thresholdLabel: null,
                  citation: null,
                  sourceUrl: null,
                },
                us: {
                  status: "no_threshold",
                  kind: null,
                  binding: false,
                  thresholdLabel: null,
                  citation: null,
                  sourceUrl: null,
                },
                who: null,
                strict: {
                  status: "compliant",
                  kind: "site_metric",
                  binding: false,
                  thresholdLabel: "< 0,034 / 0,1 µg/L",
                  citation: "référence stricte",
                  sourceUrl: null,
                },
              },
            },
            {
              parameterCode: "5347",
              parameterLabel: "PFOA",
              rawText: "0,001",
              numericValue: 0.001,
              qualifier: "eq",
              unit: "µg/L",
              sampledAt: "2026-05-18T11:55:00.000Z",
              resolution: {
                canonicalId: "pfoa",
                canonicalName: "PFOA",
                category: "pfas",
                displayPriority: 10,
                canonicalUnit: "µg/L",
                canonicalNumericValue: 0.001,
                conversion: "identity",
              },
              comparisons: {
                fr: {
                  status: "no_threshold",
                  kind: null,
                  binding: false,
                  thresholdLabel: null,
                  citation: null,
                  sourceUrl: null,
                },
                eu: {
                  status: "no_threshold",
                  kind: null,
                  binding: false,
                  thresholdLabel: null,
                  citation: null,
                  sourceUrl: null,
                },
                ch: {
                  status: "compliant",
                  kind: "legal_limit",
                  binding: true,
                  thresholdLabel: "0,001 / 0,5 µg/L",
                  citation: "OPBD",
                  sourceUrl: "https://www.fedlex.admin.ch",
                },
                us: {
                  status: "compliant",
                  kind: "legal_limit",
                  binding: true,
                  thresholdLabel: "0,001 / 0,004 µg/L",
                  citation: "NPDWR",
                  sourceUrl: "https://www.epa.gov",
                },
                who: null,
                strict: {
                  status: "compliant",
                  kind: "site_metric",
                  binding: false,
                  thresholdLabel: "0,001 / 0,004 µg/L",
                  citation: "référence stricte",
                  sourceUrl: null,
                },
              },
            },
            {
              parameterCode: "1370",
              parameterLabel: "Aluminium total µg/l",
              rawText: "0,005",
              numericValue: 0.005,
              qualifier: "gt",
              unit: "mg/L",
              sampledAt: "2026-06-18T11:40:00.000Z",
              resolution: {
                canonicalId: "aluminium",
                canonicalName: "Aluminium",
                category: "metals",
                displayPriority: 37,
                canonicalUnit: "µg/L",
                canonicalNumericValue: 5,
                conversion: "converted",
              },
              comparisons: {
                fr: {
                  status: "exceedance",
                  kind: "quality_reference",
                  binding: false,
                  thresholdLabel: "≤ 200 µg/L",
                  citation: "arrêté",
                  sourceUrl: "https://example.test",
                },
                eu: null,
                ch: {
                  status: "compliant",
                  kind: "legal_limit",
                  binding: true,
                  thresholdLabel: "5 / 200 µg/L",
                  citation: "OPBD",
                  sourceUrl: "https://example.test",
                },
                us: null,
                who: null,
                strict: {
                  status: "exceedance",
                  kind: "site_metric",
                  binding: false,
                  thresholdLabel: "300 / 200 µg/L",
                  citation: "référence stricte",
                  sourceUrl: null,
                },
              },
            },
            {
              parameterCode: "9999",
              parameterLabel: "Inconnu",
              rawText: "1",
              numericValue: 1,
              qualifier: "eq",
              unit: "mg/L",
              sampledAt: "not-a-date",
              resolution: {
                canonicalId: "unlisted:9999",
                canonicalName: "Inconnu",
                category: "unlisted",
                displayPriority: 1000,
                canonicalUnit: null,
                canonicalNumericValue: 1,
                conversion: "identity",
              },
              comparisons: {
                fr: {
                  status: "no_threshold",
                  kind: null,
                  binding: false,
                  thresholdLabel: null,
                  citation: null,
                  sourceUrl: null,
                },
                eu: {
                  status: "no_threshold",
                  kind: null,
                  binding: false,
                  thresholdLabel: null,
                  citation: null,
                  sourceUrl: null,
                },
                ch: {
                  status: "no_threshold",
                  kind: null,
                  binding: false,
                  thresholdLabel: null,
                  citation: null,
                  sourceUrl: null,
                },
                us: {
                  status: "no_threshold",
                  kind: null,
                  binding: false,
                  thresholdLabel: null,
                  citation: null,
                  sourceUrl: null,
                },
                who: null,
                strict: {
                  status: "no_threshold",
                  kind: null,
                  binding: false,
                  thresholdLabel: null,
                  citation: null,
                  sourceUrl: null,
                },
              },
            },
            {
              parameterCode: "aspect",
              parameterLabel: "Aspect",
              rawText: "normal",
              numericValue: null,
              qualifier: "eq",
              unit: null,
              sampledAt: "2026-06-18T11:40:00.000Z",
              resolution: null,
              comparisons: {
                fr: {
                  status: "not_comparable",
                  kind: null,
                  binding: false,
                  thresholdLabel: null,
                  citation: null,
                  sourceUrl: null,
                },
                eu: {
                  status: "below_loq",
                  kind: "legal_limit",
                  binding: true,
                  thresholdLabel: null,
                  citation: null,
                  sourceUrl: "https://example.test/seuil",
                },
                ch: {
                  status: "no_threshold",
                  kind: null,
                  binding: false,
                  thresholdLabel: null,
                  citation: null,
                  sourceUrl: null,
                },
                us: {
                  status: "no_threshold",
                  kind: null,
                  binding: false,
                  thresholdLabel: null,
                  citation: null,
                  sourceUrl: null,
                },
                who: null,
                strict: {
                  status: "no_threshold",
                  kind: null,
                  binding: false,
                  thresholdLabel: null,
                  citation: null,
                  sourceUrl: null,
                },
              },
            },
          ],
        }),
      ),
    );

    render(<NetworkAnalyses networkCode="033001214" />);
    expect(screen.getByText(/Chargement/)).toBeTruthy();
    await waitFor(() => {
      expect(screen.getByText("Eau conforme")).toBeTruthy();
    });
    expect(screen.getByText("Historique")).toBeTruthy();
    expect(screen.getByText("tendance stable")).toBeTruthy();
    expect(screen.getByText(/quantification a changé/)).toBeTruthy();
    expect(screen.getByLabelText(/Évolution Nitrates/)).toBeTruthy();
    expect(screen.getByText("Points de vigilance")).toBeTruthy();
    expect(screen.getByText("Comparaison par substance")).toBeTruthy();
    expect(screen.getByText("Toutes les analyses")).toBeTruthy();
    expect(screen.getByText("Sources")).toBeTruthy();
    expect(screen.getByText("Mesures")).toBeTruthy();
    expect(screen.getAllByText("non analysé").length).toBeGreaterThan(0);
    expect(screen.getAllByText("033001214").length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: "Arrêté du 30 décembre 2022" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Source du seuil" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "OPBD" })).toBeTruthy();
    expect(screen.getByText("Limites bactériologiques : conformes")).toBeTruthy();
    expect(screen.getByText("PFAS")).toBeTruthy();
    expect(screen.getAllByText("Pas d’analyse récente").length).toBeGreaterThan(0);
    expect(screen.getByText(/On ne dit pas si l’eau/)).toBeTruthy();
    expect(screen.getAllByText("Somme PFAS-20").length).toBeGreaterThan(0);
    expect(screen.getAllByText("PFOA").length).toBeGreaterThan(0);
    expect(screen.getAllByText("<0,034 µg/L").length).toBeGreaterThan(0);
    expect(screen.getAllByText("reconstruit").length).toBeGreaterThan(0);
    expect(screen.getAllByText("< 0,034 / 0,1 µg/L").length).toBeGreaterThan(0);
    expect(screen.getAllByText("0,001 / 0,5 µg/L").length).toBeGreaterThan(0);
    expect(screen.getAllByText("0,001 / 0,004 µg/L").length).toBeGreaterThan(0);
    expect(screen.getAllByText("conforme").length).toBeGreaterThan(0);
    expect(screen.getAllByText("dépassement").length).toBeGreaterThan(0);
    expect(screen.getAllByText("non comparable").length).toBeGreaterThan(0);
    expect(screen.getAllByText("LQ > seuil").length).toBeGreaterThan(0);
    expect(screen.getAllByText("FR").length).toBeGreaterThan(0);
    expect(screen.getAllByText("UE").length).toBeGreaterThan(0);
    expect(screen.getAllByText("CH").length).toBeGreaterThan(0);
    expect(screen.getAllByText("US").length).toBeGreaterThan(0);
    expect(screen.getAllByText("OMS").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Stricte").length).toBeGreaterThan(0);
    const exceedanceChips = screen.getAllByRole("button", {
      name: /Aluminium : non conforme/,
    });
    expect(exceedanceChips.length).toBeGreaterThan(0);
    expect(screen.queryByText("Détail par norme")).toBeNull();
    act(() => {
      exceedanceChips[0]?.click();
    });
    expect(screen.getByText("Détail par norme")).toBeTruthy();
    expect(screen.getByText(/métrique du site/)).toBeTruthy();
    expect(screen.getAllByText("référence stricte (site)").length).toBeGreaterThan(
      0,
    );
    expect(screen.getAllByText("Aluminium").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Inconnu").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Aspect").length).toBeGreaterThan(0);
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/somme PFAS-20/).length).toBeGreaterThan(1);
    vi.unstubAllGlobals();
  });

  it("shows unavailable and empty states", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ error: "nope" }, { status: 503 })));
    const first = render(<NetworkAnalyses networkCode="033001214" />);
    await waitFor(() => {
      expect(screen.getByText(/Impossible de charger/)).toBeTruthy();
    });
    first.unmount();

    vi.stubGlobal("fetch", vi.fn(async () => {
      throw new Error("offline");
    }));
    const second = render(<NetworkAnalyses networkCode="033001215" />);
    await waitFor(() => {
      expect(screen.getByText(/Impossible de charger/)).toBeTruthy();
    });
    second.unmount();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({
          networkCode: "033001214",
          windowFrom: "2025-09-02",
          source: "remote",
          latestSample: null,
          latestMeasurements: [],
        }),
      ),
    );
    const empty = render(<NetworkAnalyses networkCode="033001216" />);
    await waitFor(() => {
      expect(screen.getByText(/Aucune analyse/)).toBeTruthy();
    });
    expect(screen.getByText("Toutes les analyses")).toBeTruthy();
    expect(screen.getByText("Sources")).toBeTruthy();
    expect(screen.getAllByText("pas d’analyse récente").length).toBeGreaterThan(0);
    empty.unmount();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({
          networkCode: "033001214",
          windowFrom: "2025-09-02",
          source: "cache",
          latestSample: {
            code: "s1",
            sampledAt: "2026-06-18T11:40:00.000Z",
            conclusion: "Eau non conforme aux limites",
            conformiteLimitesBact: "N",
            conformiteLimitesPc: "C",
            source: "hubeau",
            measurements: [],
          },
          latestMeasurements: [],
        }),
      ),
    );
    render(<NetworkAnalyses networkCode="033001217" />);
    await waitFor(() => {
      expect(screen.getByText("Eau non conforme aux limites")).toBeTruthy();
    });
    expect(screen.getByText("Limites bactériologiques : non conformes")).toBeTruthy();
    expect(screen.getByText(/Aucune analyse/)).toBeTruthy();
  });

  it("ignores abort errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new DOMException("aborted", "AbortError");
      }),
    );
    render(<NetworkAnalyses networkCode="033001214" />);
    await waitFor(() => {
      expect(screen.getByText(/Chargement/)).toBeTruthy();
    });
    vi.unstubAllGlobals();
  });

  it("hides comparison tables when comparison failed", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({
          networkCode: "033001214",
          windowFrom: "2025-09-02",
          source: "cache",
          latestSample: {
            code: "s1",
            sampledAt: "2026-06-18T11:40:00.000Z",
            conclusion: "Eau conforme",
            conformiteLimitesBact: "C",
            conformiteLimitesPc: "C",
            source: "hubeau",
            measurements: [],
          },
          latestMeasurements: [
            {
              parameterCode: "1340",
              parameterLabel: "Nitrates",
              rawText: "8",
              numericValue: 8,
              qualifier: "eq",
              unit: "mg/L",
              sampledAt: "2026-06-18T11:40:00.000Z",
              resolution: {
                canonicalId: "nitrates",
                canonicalName: "Nitrates",
                category: "nutrients",
                displayPriority: 20,
                canonicalUnit: "mg/L",
                canonicalNumericValue: 8,
                conversion: "identity",
              },
            },
          ],
          comparisonFailed: true,
        }),
      ),
    );
    render(<NetworkAnalyses networkCode="033001214" />);
    await waitFor(() => {
      expect(
        screen.getByText(/comparaisons sont temporairement indisponibles/i),
      ).toBeTruthy();
    });
    expect(screen.queryByText("Comparaison par substance")).toBeNull();
    expect(screen.queryByText("Toutes les analyses")).toBeNull();
  });

  it("remaps copy on locale switch without refetch", async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({
        networkCode: "033001214",
        windowFrom: "2025-09-02",
        source: "cache",
        latestSample: null,
        latestMeasurements: [],
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    render(<NetworkAnalyses networkCode="033001214" />);
    await waitFor(() => {
      expect(screen.getByText("Dernières analyses")).toBeTruthy();
    });
    act(() => {
      setStoredLocale("en");
    });
    expect(screen.getByText("Latest analyses")).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
