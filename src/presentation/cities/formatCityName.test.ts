import { describe, expect, it } from "vitest";
import { displayCityName, formatCityName } from "./formatCityName";

describe("formatCityName", () => {
  it("lowercases then capitalizes the first letter, keeping accents", () => {
    expect(formatCityName("RENNES")).toBe("Rennes");
    expect(formatCityName("nîmes")).toBe("Nîmes");
    expect(formatCityName("NÎMES")).toBe("Nîmes");
    expect(formatCityName("SAINT-ÉTIENNE")).toBe("Saint-étienne");
    expect(formatCityName("  béziers ")).toBe("Béziers");
    expect(formatCityName("")).toBe("");
    expect(formatCityName("   ")).toBe("");
  });
});

describe("displayCityName", () => {
  it("prefers the catalog name so accents are not lost", () => {
    expect(displayCityName("35238", "RENNES")).toBe("Rennes");
    expect(displayCityName("30189", "NIMES")).toBe("Nîmes");
    expect(displayCityName("42218", "SAINT-ETIENNE")).toBe("Saint-Étienne");
  });

  it("formats the fallback when the commune is not in the catalog", () => {
    expect(displayCityName("81004", "ALBI")).toBe("Albi");
    expect(displayCityName("81004")).toBe("");
    expect(displayCityName("81004", null)).toBe("");
  });
});
