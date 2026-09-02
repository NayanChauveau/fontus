import { describe, expect, it } from "vitest";
import type { ThresholdVersion } from "../../norms/domain/ThresholdVersion";
import { compareMeasurement } from "./compareMeasurement";

const nitrates: ThresholdVersion = {
  id: "nitrates:fr",
  parameterId: "nitrates",
  jurisdiction: "fr",
  unit: "mg/L",
  value: 50,
  valueMax: null,
  operator: "lte",
  kind: "legal_limit",
  binding: true,
  validFrom: new Date("2007-01-11T00:00:00.000Z"),
  validTo: null,
  citation: "arrêté",
  sourceUrl: "https://example.test",
};

const hardnessMin: ThresholdVersion = {
  ...nitrates,
  id: "hardness:fr",
  parameterId: "hardness",
  operator: "gte",
  value: 15,
  unit: "°f",
  kind: "quality_reference",
  binding: false,
};

const ph: ThresholdVersion = {
  ...nitrates,
  id: "ph:fr",
  parameterId: "ph",
  operator: "range",
  value: 6.5,
  valueMax: 9,
  unit: "unité pH",
  kind: "quality_reference",
  binding: false,
};

describe("compareMeasurement", () => {
  it("is compliant under a legal max and an exceedance above it", () => {
    expect(
      compareMeasurement(
        {
          parameterId: "nitrates",
          canonicalNumericValue: 12.3,
          qualifier: "eq",
          conversion: "identity",
        },
        nitrates,
      ).status,
    ).toBe("compliant");
    expect(
      compareMeasurement(
        {
          parameterId: "nitrates",
          canonicalNumericValue: 51,
          qualifier: "eq",
          conversion: "identity",
        },
        nitrates,
      ).status,
    ).toBe("exceedance");
  });

  it("treats < LQ under the max as compliant and LQ above the max as inconclusive", () => {
    expect(
      compareMeasurement(
        {
          parameterId: "nitrites",
          canonicalNumericValue: 0.01,
          qualifier: "lt",
          conversion: "identity",
        },
        { ...nitrates, id: "nitrites:fr", parameterId: "nitrites", value: 0.5 },
      ).status,
    ).toBe("compliant");
    expect(
      compareMeasurement(
        {
          parameterId: "lead",
          canonicalNumericValue: 20,
          qualifier: "lt",
          conversion: "identity",
        },
        { ...nitrates, id: "lead:fr", parameterId: "lead", value: 10, unit: "µg/L" },
      ).status,
    ).toBe("below_loq");
  });

  it("treats > X above a max as exceedance and otherwise as not comparable", () => {
    expect(
      compareMeasurement(
        {
          parameterId: "nitrates",
          canonicalNumericValue: 50,
          qualifier: "gt",
          conversion: "identity",
        },
        nitrates,
      ).status,
    ).toBe("exceedance");
    expect(
      compareMeasurement(
        {
          parameterId: "nitrates",
          canonicalNumericValue: 10,
          qualifier: "gt",
          conversion: "identity",
        },
        nitrates,
      ).status,
    ).toBe("not_comparable");
  });

  it("handles a minimum and a pH range", () => {
    expect(
      compareMeasurement(
        {
          parameterId: "hardness",
          canonicalNumericValue: 20,
          qualifier: "eq",
          conversion: "identity",
        },
        hardnessMin,
      ).status,
    ).toBe("compliant");
    expect(
      compareMeasurement(
        {
          parameterId: "hardness",
          canonicalNumericValue: 10,
          qualifier: "eq",
          conversion: "identity",
        },
        hardnessMin,
      ).status,
    ).toBe("exceedance");
    expect(
      compareMeasurement(
        {
          parameterId: "hardness",
          canonicalNumericValue: 10,
          qualifier: "lt",
          conversion: "identity",
        },
        hardnessMin,
      ).status,
    ).toBe("exceedance");
    expect(
      compareMeasurement(
        {
          parameterId: "hardness",
          canonicalNumericValue: 20,
          qualifier: "lt",
          conversion: "identity",
        },
        hardnessMin,
      ).status,
    ).toBe("below_loq");
    expect(
      compareMeasurement(
        {
          parameterId: "hardness",
          canonicalNumericValue: 15,
          qualifier: "gt",
          conversion: "identity",
        },
        hardnessMin,
      ).status,
    ).toBe("compliant");
    expect(
      compareMeasurement(
        {
          parameterId: "ph",
          canonicalNumericValue: 7.2,
          qualifier: "eq",
          conversion: "identity",
        },
        ph,
      ).status,
    ).toBe("compliant");
    expect(
      compareMeasurement(
        {
          parameterId: "ph",
          canonicalNumericValue: 10,
          qualifier: "eq",
          conversion: "identity",
        },
        ph,
      ).status,
    ).toBe("exceedance");
    expect(
      compareMeasurement(
        {
          parameterId: "ph",
          canonicalNumericValue: 6,
          qualifier: "lt",
          conversion: "identity",
        },
        ph,
      ).status,
    ).toBe("exceedance");
    expect(
      compareMeasurement(
        {
          parameterId: "ph",
          canonicalNumericValue: 10,
          qualifier: "gt",
          conversion: "identity",
        },
        ph,
      ).status,
    ).toBe("exceedance");
    expect(
      compareMeasurement(
        {
          parameterId: "ph",
          canonicalNumericValue: 7,
          qualifier: "gt",
          conversion: "identity",
        },
        ph,
      ).status,
    ).toBe("not_comparable");
    expect(
      compareMeasurement(
        {
          parameterId: "hardness",
          canonicalNumericValue: 10,
          qualifier: "gt",
          conversion: "identity",
        },
        hardnessMin,
      ).status,
    ).toBe("not_comparable");
    expect(
      compareMeasurement(
        {
          parameterId: "ph",
          canonicalNumericValue: 8,
          qualifier: "eq",
          conversion: "identity",
        },
        { ...ph, valueMax: null },
      ).status,
    ).toBe("exceedance");
    expect(
      compareMeasurement(
        {
          parameterId: "ph",
          canonicalNumericValue: 8,
          qualifier: "gt",
          conversion: "identity",
        },
        { ...ph, valueMax: null },
      ).status,
    ).toBe("exceedance");
  });

  it("does not invent a comparison without a threshold, a number or a convertible unit", () => {
    expect(
      compareMeasurement(
        {
          parameterId: "pfoa",
          canonicalNumericValue: 0.001,
          qualifier: "eq",
          conversion: "identity",
        },
        null,
      ).status,
    ).toBe("no_threshold");
    expect(
      compareMeasurement(
        {
          parameterId: null,
          canonicalNumericValue: 1,
          qualifier: "eq",
          conversion: "identity",
        },
        nitrates,
      ).status,
    ).toBe("no_threshold");
    expect(
      compareMeasurement(
        {
          parameterId: "nitrates",
          canonicalNumericValue: null,
          qualifier: "eq",
          conversion: "not_numeric",
        },
        nitrates,
      ).status,
    ).toBe("not_comparable");
    expect(
      compareMeasurement(
        {
          parameterId: "nitrates",
          canonicalNumericValue: 1,
          qualifier: "eq",
          conversion: "not_convertible",
        },
        nitrates,
      ).status,
    ).toBe("not_comparable");
  });
});
