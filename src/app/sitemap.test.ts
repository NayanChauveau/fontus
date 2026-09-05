import { describe, expect, it } from "vitest";
import { LARGEST_CITIES } from "@/application/cities/largestCities";
import { CITY_HUB_PATH, cityPagePath, EDITORIAL_PATHS } from "@/presentation/editorial/paths";
import sitemap from "./sitemap";

describe("sitemap", () => {
  it("lists home, legal, editorial and 51 city pages, not share queries", () => {
    const urls = sitemap().map((entry) => entry.url);
    const cityUrls = urls.filter((url) => url.includes("/eau-robinet"));
    expect(urls).toEqual([
      "https://fontus.fr",
      "https://fontus.fr/mentions-legales",
      "https://fontus.fr/confidentialite",
      ...EDITORIAL_PATHS.map((path) => `https://fontus.fr${path}`),
      "https://fontus.fr/eau-robinet",
      ...LARGEST_CITIES.map((city) => `https://fontus.fr${cityPagePath(city.slug)}`),
    ]);
    expect(cityUrls).toHaveLength(51);
    expect(urls).toContain(`https://fontus.fr${CITY_HUB_PATH}`);
    expect(urls).toContain("https://fontus.fr/eau-robinet/paris");
    expect(urls.some((url) => url.includes("insee"))).toBe(false);
  });
});
