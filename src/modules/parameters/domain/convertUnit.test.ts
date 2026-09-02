import { describe, expect, it } from "vitest";
import { convertUnit } from "./convertUnit";
import { normalizeUnit } from "./normalizeUnit";

describe("normalizeUnit", () => {
  it("treats mg(Cu)/L as mg/L so Hub’Eau analyte units convert", () => {
    expect(normalizeUnit("mg(Cu)/L")).toBe("mg/L");
    expect(normalizeUnit("µg/L")).toBe("µg/L");
    expect(normalizeUnit("ug/L")).toBe("µg/L");
    expect(normalizeUnit("UG/L")).toBe("µg/L");
    expect(normalizeUnit("SANS OBJET")).toBeNull();
    expect(normalizeUnit(null)).toBeNull();
    expect(normalizeUnit(undefined)).toBeNull();
    expect(normalizeUnit("")).toBeNull();
    expect(normalizeUnit("   ")).toBeNull();
    expect(normalizeUnit("μg/L")).toBe("µg/L");
    expect(normalizeUnit("g/L")).toBe("g/L");
    expect(normalizeUnit("NFU")).toBe("NFU");
  });
});

describe("convertUnit", () => {
  it("converts mg/L ↔ µg/L before any threshold comparison", () => {
    expect(convertUnit(0.01, "mg/L", "µg/L")).toEqual({
      status: "converted",
      value: 10,
      unit: "µg/L",
    });
    expect(convertUnit(200, "µg/L", "mg/L")).toEqual({
      status: "converted",
      value: 0.2,
      unit: "mg/L",
    });
  });

  it("keeps < LQ as the converted limit, not zero", () => {
    const converted = convertUnit(0.01, "mg/L", "µg/L");
    expect(converted.status).toBe("converted");
    expect(converted.value).toBe(10);
    expect(converted.value).not.toBe(0);
  });

  it("is identity when units already match after normalize", () => {
    expect(convertUnit(2.1, "mg(Cu)/L", "mg/L")).toEqual({
      status: "identity",
      value: 2.1,
      unit: "mg/L",
    });
  });

  it("does not invent a number for a qualitative result", () => {
    expect(convertUnit(null, "mg/L", "µg/L")).toEqual({
      status: "not_numeric",
      value: null,
      unit: "µg/L",
    });
    expect(convertUnit(Number.NaN, "mg/L", "µg/L").status).toBe("not_numeric");
    expect(convertUnit(1, undefined, undefined).status).toBe("identity");
  });

  it("refuses a conversion between incompatible units", () => {
    expect(convertUnit(1, "NFU", "mg/L")).toEqual({
      status: "not_convertible",
      value: null,
      unit: "mg/L",
    });
  });
});
