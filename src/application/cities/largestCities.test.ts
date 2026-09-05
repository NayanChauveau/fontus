import { describe, expect, it } from "vitest";
import { isInseeCitycode } from "../citycode";
import {
  LARGEST_CITIES,
  findCityByInsee,
  findCityBySlug,
} from "./largestCities";

describe("largestCities", () => {
  it("lists 50 metropolitan communes with unique slugs and INSEE codes", () => {
    expect(LARGEST_CITIES).toHaveLength(50);
    expect(new Set(LARGEST_CITIES.map((city) => city.slug)).size).toBe(50);
    expect(new Set(LARGEST_CITIES.map((city) => city.insee)).size).toBe(50);
    expect(LARGEST_CITIES.every((city) => isInseeCitycode(city.insee))).toBe(
      true,
    );
  });

  it("uses commune codes for Paris, Lyon and Marseille", () => {
    expect(findCityBySlug("paris")?.insee).toBe("75056");
    expect(findCityBySlug("lyon")?.insee).toBe("69123");
    expect(findCityBySlug("marseille")?.insee).toBe("13055");
  });

  it("maps saint-denis to Seine-Saint-Denis, not Réunion", () => {
    expect(findCityBySlug("saint-denis")).toEqual({
      slug: "saint-denis",
      insee: "93066",
      name: "Saint-Denis",
      department: "Seine-Saint-Denis",
    });
    expect(findCityByInsee("97411")).toBeUndefined();
  });

  it("finds a city by INSEE after normalizing", () => {
    expect(findCityByInsee(" 33063 ")?.slug).toBe("bordeaux");
  });

  it("returns undefined for unknown slug or INSEE", () => {
    expect(findCityBySlug("unknown")).toBeUndefined();
    expect(findCityByInsee("99999")).toBeUndefined();
  });
});
