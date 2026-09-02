import { describe, expect, it } from "vitest";
import { isInseeCitycode } from "./AddressCandidate";
import { toAddressCandidate } from "./toAddressCandidate";

const valid = {
  sourceId: "33063_8390_00012",
  label: "12 Rue Sainte-Catherine 33000 Bordeaux",
  city: "Bordeaux",
  citycode: "33063",
  longitude: -0.574364,
  latitude: 44.841405,
};

describe("isInseeCitycode", () => {
  it("accepts metropolitan and Corsican codes", () => {
    expect(isInseeCitycode("33063")).toBe(true);
    expect(isInseeCitycode("2A004")).toBe(true);
    expect(isInseeCitycode("2b004")).toBe(true);
  });

  it("rejects incomplete or postal codes mistaken for INSEE", () => {
    expect(isInseeCitycode("3306")).toBe(false);
    expect(isInseeCitycode("330000")).toBe(false);
    expect(isInseeCitycode("")).toBe(false);
  });
});

describe("toAddressCandidate", () => {
  it("maps a complete GeoPF address", () => {
    expect(toAddressCandidate(valid)).toEqual(valid);
  });

  it("normalizes Corsican citycode", () => {
    expect(
      toAddressCandidate({ ...valid, citycode: "2a004" })?.citycode,
    ).toBe("2A004");
  });

  it("drops a feature without citycode — commune cannot be resolved", () => {
    expect(toAddressCandidate({ ...valid, citycode: undefined })).toBeNull();
  });

  it("drops a feature without coordinates", () => {
    expect(toAddressCandidate({ ...valid, longitude: Number.NaN })).toBeNull();
  });
});
