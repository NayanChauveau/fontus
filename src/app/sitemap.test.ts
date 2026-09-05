import { describe, expect, it } from "vitest";
import { EDITORIAL_PATHS } from "@/presentation/editorial/paths";
import sitemap from "./sitemap";

describe("sitemap", () => {
  it("lists home, legal pages and editorial pages, not share queries", () => {
    const urls = sitemap().map((entry) => entry.url);
    expect(urls).toEqual([
      "https://fontus.fr",
      "https://fontus.fr/mentions-legales",
      "https://fontus.fr/confidentialite",
      ...EDITORIAL_PATHS.map((path) => `https://fontus.fr${path}`),
    ]);
    expect(urls.some((url) => url.includes("insee"))).toBe(false);
  });
});
