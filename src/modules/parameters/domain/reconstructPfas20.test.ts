import { describe, expect, it } from "vitest";
import { PFAS20_MEMBER_IDS } from "./priorityCatalog";
import {
  reconstructPfas20,
  type ReconstructableMeasurement,
} from "./reconstructPfas20";

const SAMPLED_AT = "2026-06-30T11:59:00.000Z";

describe("reconstructPfas20", () => {
  it("lists the 20 regulated substances", () => {
    expect(PFAS20_MEMBER_IDS).toHaveLength(20);
    expect(PFAS20_MEMBER_IDS).not.toContain("pfas20");
  });

  it("rebuilds an upper bound from the 20 members of the same sample", () => {
    const [pfas20, ...rest] = reconstructPfas20([
      row("pfas20", { rawText: "<SEUIL", numeric: null, qualifier: "lt" }),
      ...PFAS20_MEMBER_IDS.map((id) =>
        row(id, { rawText: "<0,001", numeric: 0.001, qualifier: "lt" }),
      ),
    ]);

    expect(pfas20?.rawText).toBe("<0,02");
    expect(pfas20?.numericValue).toBe(0.02);
    expect(pfas20?.qualifier).toBe("lt");
    expect(pfas20?.resolution?.canonicalNumericValue).toBe(0.02);
    expect(pfas20?.resolution?.derived).toBe("reconstructed_sum");
    expect(rest.every((item) => item.resolution?.derived == null)).toBe(true);
  });

  it("keeps an official numeric sum and refuses an incomplete or later panel", () => {
    const official = reconstructPfas20([
      row("pfas20", { rawText: "0,016", numeric: 0.016, qualifier: "eq" }),
      ...PFAS20_MEMBER_IDS.map((id) =>
        row(id, { rawText: "<0,001", numeric: 0.001, qualifier: "lt" }),
      ),
    ]);
    expect(official[0]?.rawText).toBe("0,016");
    expect(official[0]?.resolution?.derived).toBeUndefined();

    const incomplete = reconstructPfas20([
      row("pfas20", { rawText: "<SEUIL", numeric: null, qualifier: "lt" }),
      row("pfoa", { rawText: "<0,001", numeric: 0.001, qualifier: "lt" }),
    ]);
    expect(incomplete[0]?.rawText).toBe("<SEUIL");

    const mixedDates = reconstructPfas20([
      row("pfas20", { rawText: "<SEUIL", numeric: null, qualifier: "lt" }),
      ...PFAS20_MEMBER_IDS.map((id, index) =>
        row(id, {
          rawText: "<0,001",
          numeric: 0.001,
          qualifier: "lt",
          sampledAt:
            index === 0 ? "2026-05-20T12:55:00.000Z" : SAMPLED_AT,
        }),
      ),
    ]);
    expect(mixedDates[0]?.rawText).toBe("<SEUIL");
  });

  it("sums quantified members and refuses a greater-than result", () => {
    const mixed = reconstructPfas20([
      row("pfas20", { rawText: "<SEUIL", numeric: null, qualifier: "lt" }),
      ...PFAS20_MEMBER_IDS.map((id, index) =>
        row(id, {
          rawText: index === 0 ? "0,004" : "<0,001",
          numeric: index === 0 ? 0.004 : 0.001,
          qualifier: index === 0 ? "eq" : "lt",
        }),
      ),
    ]);
    expect(mixed[0]?.qualifier).toBe("lt");
    expect(mixed[0]?.numericValue).toBe(0.023);

    const exact = reconstructPfas20([
      row("pfas20", { rawText: "<SEUIL", numeric: null, qualifier: "lt" }),
      ...PFAS20_MEMBER_IDS.map((id) =>
        row(id, { rawText: "0,001", numeric: 0.001, qualifier: "eq" }),
      ),
    ]);
    expect(exact[0]?.rawText).toBe("0,02");
    expect(exact[0]?.qualifier).toBe("eq");

    const greater = reconstructPfas20([
      row("pfas20", { rawText: "<SEUIL", numeric: null, qualifier: "lt" }),
      ...PFAS20_MEMBER_IDS.map((id, index) =>
        row(id, {
          rawText: index === 0 ? ">0,01" : "<0,001",
          numeric: index === 0 ? 0.01 : 0.001,
          qualifier: index === 0 ? "gt" : "lt",
        }),
      ),
    ]);
    expect(greater[0]?.rawText).toBe("<SEUIL");
  });

  it("skips a sum without a sampling date or a non-numeric member", () => {
    const noDate = reconstructPfas20([
      {
        ...row("pfas20", { rawText: "<SEUIL", numeric: null, qualifier: "lt" }),
        sampledAt: undefined,
      },
      ...PFAS20_MEMBER_IDS.map((id) =>
        row(id, { rawText: "<0,001", numeric: 0.001, qualifier: "lt" }),
      ),
    ]);
    expect(noDate[0]?.rawText).toBe("<SEUIL");

    const broken = reconstructPfas20([
      row("pfas20", { rawText: "<SEUIL", numeric: null, qualifier: "lt" }),
      ...PFAS20_MEMBER_IDS.map((id, index) =>
        row(id, {
          rawText: "<0,001",
          numeric: index === 0 ? null : 0.001,
          qualifier: "lt",
          conversion: index === 0 ? "not_numeric" : "identity",
        }),
      ),
    ]);
    expect(broken[0]?.rawText).toBe("<SEUIL");

    const notConvertible = reconstructPfas20([
      row("pfas20", { rawText: "<SEUIL", numeric: null, qualifier: "lt" }),
      ...PFAS20_MEMBER_IDS.map((id, index) =>
        row(id, {
          rawText: "1",
          numeric: index === 0 ? 1 : 0.001,
          qualifier: "eq",
          conversion: index === 0 ? "not_convertible" : "identity",
        }),
      ),
    ]);
    expect(notConvertible[0]?.rawText).toBe("<SEUIL");
  });
});

function row(
  canonicalId: string,
  input: {
    rawText: string;
    numeric: number | null;
    qualifier: "eq" | "lt" | "gt";
    sampledAt?: string;
    conversion?: "identity" | "not_numeric" | "not_convertible";
  },
): ReconstructableMeasurement {
  return {
    qualifier: input.qualifier,
    rawText: input.rawText,
    numericValue: input.numeric,
    sampledAt: input.sampledAt ?? SAMPLED_AT,
    resolution: {
      canonicalId,
      canonicalNumericValue: input.numeric,
      conversion: input.conversion ?? "identity",
    },
  };
}
