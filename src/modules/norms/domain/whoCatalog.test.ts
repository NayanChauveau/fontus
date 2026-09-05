import { describe, expect, it } from "vitest";
import { WHO_THRESHOLDS } from "./whoCatalog";

describe("WHO_THRESHOLDS", () => {
  it("seeds only non-binding guideline values and no PFAS", () => {
    expect(WHO_THRESHOLDS.every((row) => row.jurisdiction === "who")).toBe(true);
    expect(WHO_THRESHOLDS.every((row) => row.kind === "quality_reference")).toBe(
      true,
    );
    expect(WHO_THRESHOLDS.every((row) => row.binding === false)).toBe(true);
    expect(
      WHO_THRESHOLDS.some((row) => row.parameterId.startsWith("pf")),
    ).toBe(false);
    expect(
      WHO_THRESHOLDS.find((row) => row.parameterId === "fluoride")?.value,
    ).toBe(1.5);
    expect(
      WHO_THRESHOLDS.find((row) => row.parameterId === "manganese")?.value,
    ).toBe(80);
  });
});
