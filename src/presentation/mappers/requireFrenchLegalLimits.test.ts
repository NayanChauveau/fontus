import { describe, expect, it } from "vitest";
import { requireFrenchLegalLimits } from "./requireFrenchLegalLimits";

describe("requireFrenchLegalLimits", () => {
  it("returns the current nitrates limit", () => {
    expect(requireFrenchLegalLimits("nitrates", "fr").current.valueLabel).toBe(
      "50 mg/L",
    );
  });

  it("throws when the catalog has no French legal limit", () => {
    expect(() => requireFrenchLegalLimits("hardness", "fr")).toThrow(
      /hardness/,
    );
  });
});
