import { describe, expect, it } from "vitest";
import type { ThresholdVersion } from "@/modules/norms";
import { pickStrictThreshold } from "./pickStrictThreshold";

function limit(
  id: string,
  value: number,
  extras: Partial<ThresholdVersion> = {},
): ThresholdVersion {
  return {
    id,
    parameterId: "pfoa",
    jurisdiction: "us",
    unit: "µg/L",
    value,
    valueMax: null,
    operator: "lte",
    kind: "legal_limit",
    binding: true,
    validFrom: new Date("2024-06-25T00:00:00.000Z"),
    validTo: null,
    citation: "seed",
    sourceUrl: "https://example.test",
    ...extras,
  };
}

describe("pickStrictThreshold", () => {
  it("takes the lowest comparable legal max and ignores a reco", () => {
    const us = limit("pfoa:us", 0.004);
    const ch = limit("pfoa:ch", 0.5, { jurisdiction: "ch" });
    const reco = limit("pfoa:us-mclg", 0, {
      kind: "quality_reference",
      binding: false,
    });

    expect(pickStrictThreshold([null, null, ch, us, reco])).toBe(us);
  });

  it("returns null without a comparable legal max", () => {
    expect(
      pickStrictThreshold([
        limit("ph:fr", 6.5, { operator: "range", kind: "quality_reference" }),
        limit("lead:us", 15, { kind: "quality_reference", binding: false }),
        null,
      ]),
    ).toBeNull();
  });

  it("converts units before picking the lowest legal max", () => {
    const ug = limit("pfoa:us", 0.004);
    const ng = limit("pfoa:other", 2, { unit: "ng/L" });
    expect(pickStrictThreshold([ug, ng])).toBe(ng);
  });

  it("skips thresholds that cannot be converted to a mass unit", () => {
    const ug = limit("pfoa:us", 0.004);
    const ph = limit("ph:fr", 7, { unit: "pH" });
    expect(pickStrictThreshold([ph, ug])).toBe(ug);
    expect(pickStrictThreshold([ph])).toBeNull();
  });
});
