/** @vitest-environment happy-dom */

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { NetworkAnalyses } from "./NetworkAnalyses";

describe("NetworkAnalyses", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
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
          latestMeasurements: [
            {
              parameterCode: "8847",
              parameterLabel: "Somme PFAS-20",
              rawText: "0,016",
              numericValue: 0.016,
              qualifier: "eq",
              unit: "µg/L",
              sampledAt: "2026-05-18T11:55:00.000Z",
              resolution: {
                canonicalId: "pfas20",
                canonicalName: "Somme PFAS-20",
                category: "pfas",
                displayPriority: 12,
                canonicalUnit: "µg/L",
                canonicalNumericValue: 0.016,
                conversion: "identity",
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
    expect(screen.getByText("Somme PFAS-20")).toBeTruthy();
    expect(screen.getByText("Aluminium")).toBeTruthy();
    expect(screen.getByText("Inconnu")).toBeTruthy();
    expect(screen.getByText("Aspect")).toBeTruthy();
    expect(screen.getByText("—")).toBeTruthy();
    expect(screen.getByText("converti")).toBeTruthy();
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
    render(<NetworkAnalyses networkCode="033001216" />);
    await waitFor(() => {
      expect(screen.getByText(/Aucune analyse/)).toBeTruthy();
    });
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
});
