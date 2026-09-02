import { describe, expect, it } from "vitest";
import { isInseeCitycode, normalizeCitycode } from "./citycode";

describe("citycode", () => {
  it("accepts metropolitan and Corsica INSEE codes", () => {
    expect(isInseeCitycode("33063")).toBe(true);
    expect(isInseeCitycode("2A004")).toBe(true);
    expect(isInseeCitycode("2b004")).toBe(true);
    expect(isInseeCitycode("33")).toBe(false);
  });

  it("normalizes to uppercase", () => {
    expect(normalizeCitycode(" 2a004 ")).toBe("2A004");
  });
});
