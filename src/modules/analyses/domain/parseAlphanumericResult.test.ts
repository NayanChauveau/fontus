import { describe, expect, it } from "vitest";
import { parseAlphanumericResult } from "./parseAlphanumericResult";

describe("parseAlphanumericResult", () => {
  it("does not treat Hub’Eau 0.0 as zero when the text is < LQ", () => {
    expect(parseAlphanumericResult("<0,01", 0.0)).toEqual({
      rawText: "<0,01",
      numericValue: 0.01,
      qualifier: "lt",
    });
    expect(parseAlphanumericResult("<5", 0.0)).toEqual({
      rawText: "<5",
      numericValue: 5,
      qualifier: "lt",
    });
  });

  it("keeps a real measured zero", () => {
    expect(parseAlphanumericResult("0", 0.0)).toEqual({
      rawText: "0",
      numericValue: 0,
      qualifier: "eq",
    });
  });

  it("parses a French decimal as an exact value", () => {
    expect(parseAlphanumericResult("6,0", 6.0)).toEqual({
      rawText: "6,0",
      numericValue: 6,
      qualifier: "eq",
    });
  });

  it("keeps qualitative results without inventing a number", () => {
    expect(parseAlphanumericResult("Aspect normal", 0.0)).toEqual({
      rawText: "Aspect normal",
      numericValue: null,
      qualifier: "eq",
    });
  });
});
