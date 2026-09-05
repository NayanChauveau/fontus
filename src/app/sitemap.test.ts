import { describe, expect, it } from "vitest";
import sitemap from "./sitemap";

describe("sitemap", () => {
  it("lists only the pages that exist today", () => {
    const urls = sitemap().map((entry) => entry.url);
    expect(urls).toEqual([
      "https://fontus.fr",
      "https://fontus.fr/mentions-legales",
      "https://fontus.fr/confidentialite",
    ]);
    expect(urls.some((url) => url.includes("faq"))).toBe(false);
    expect(urls.some((url) => url.includes("insee"))).toBe(false);
  });
});
