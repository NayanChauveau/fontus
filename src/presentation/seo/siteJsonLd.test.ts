import { describe, expect, it } from "vitest";
import { siteJsonLd } from "./siteJsonLd";

describe("siteJsonLd", () => {
  it("builds WebSite and Organization nodes for Fontus", () => {
    const graph = siteJsonLd({
      description: "Analyses officielles de l’eau du robinet.",
      inLanguage: "fr-FR",
    });
    expect(graph).toEqual([
      {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "Fontus",
        url: "https://fontus.fr",
        description: "Analyses officielles de l’eau du robinet.",
        inLanguage: "fr-FR",
      },
      {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "Fontus",
        url: "https://fontus.fr",
      },
    ]);
  });
});
