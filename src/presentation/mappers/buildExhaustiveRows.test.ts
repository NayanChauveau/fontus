import { describe, expect, it } from "vitest";
import { buildExhaustiveRows } from "./buildExhaustiveRows";
import type { NetworkMeasurementViewModel } from "../view-models/NetworkAnalysesViewModel";

describe("buildExhaustiveRows", () => {
  it("keeps measured watch rows and marks the others as not analysed", () => {
    const rows = buildExhaustiveRows(
      [
        measured("nitrates", "Nitrates", "8 mg/L"),
        measured("aluminium", "Aluminium", "5 µg/L"),
      ],
      { networkCode: "016000262", hasRecentSample: true },
    );

    expect(rows[0]?.canonicalId).toBe("pfas20");
    expect(rows[0]?.valueLabel).toBe("non analysé");
    expect(rows[0]?.emptyKind).toBe("not_analysed");
    expect(rows[0]?.udiLabel).toBe("016000262");
    expect(rows.find((row) => row.canonicalId === "nitrates")?.emptyKind).toBeNull();
    expect(rows.at(-1)?.canonicalId).toBe("aluminium");
  });

  it("uses pas d’analyse récente when the window has no sample", () => {
    const rows = buildExhaustiveRows([], {
      networkCode: "033001214",
      hasRecentSample: false,
    });

    expect(rows).toHaveLength(12);
    expect(rows.every((row) => row.emptyKind === "no_recent")).toBe(true);
    expect(rows[0]?.valueLabel).toBe("pas d’analyse récente");
  });
});

function measured(
  canonicalId: string,
  parameterLabel: string,
  valueLabel: string,
): NetworkMeasurementViewModel {
  return {
    parameterCode: canonicalId,
    parameterLabel,
    canonicalName: parameterLabel,
    canonicalId,
    category: "nutrients",
    originalLabel: null,
    valueLabel,
    canonicalValueLabel: valueLabel,
    converted: false,
    reconstructed: false,
    sampledAtLabel: "18 juin 2026",
    sourceLabel: "Hub’Eau",
    udiLabel: "016000262",
    unitLabel: "mg/L",
    emptyKind: null,
    priority: true,
    fr: null,
    eu: null,
    ch: null,
    us: null,
    who: null,
    strict: null,
  };
}
