import { describe, expect, it } from "vitest";
import { cityHubJsonLd, cityPageJsonLd } from "./cityPageJsonLd";

describe("cityPageJsonLd", () => {
  it("describes the city page, the place and the breadcrumb", () => {
    const graph = cityPageJsonLd({
      name: "Toulouse",
      title: "Qualité de l’eau du robinet à Toulouse",
      description: "Analyses à Toulouse (Haute-Garonne, 31555).",
      slug: "toulouse",
      department: "Haute-Garonne",
      inLanguage: "fr-FR",
      homeLabel: "Accueil",
      hubLabel: "Grandes villes",
    });
    expect(graph[0]).toMatchObject({
      "@type": "WebPage",
      name: "Qualité de l’eau du robinet à Toulouse",
      url: "https://fontus.fr/eau-robinet/toulouse",
      about: {
        "@type": "Place",
        name: "Toulouse",
        containedInPlace: { name: "Haute-Garonne" },
      },
    });
    expect(graph[1]).toMatchObject({
      "@type": "BreadcrumbList",
      itemListElement: [
        { position: 1, name: "Accueil", item: "https://fontus.fr" },
        {
          position: 2,
          name: "Grandes villes",
          item: "https://fontus.fr/eau-robinet",
        },
        {
          position: 3,
          name: "Toulouse",
          item: "https://fontus.fr/eau-robinet/toulouse",
        },
      ],
    });
  });
});

describe("cityHubJsonLd", () => {
  it("describes the hub as a collection", () => {
    const graph = cityHubJsonLd({
      title: "Qualité de l’eau du robinet dans les grandes villes",
      description: "50 communes.",
      inLanguage: "fr-FR",
      homeLabel: "Accueil",
      hubLabel: "Grandes villes",
    });
    expect(graph[0]).toMatchObject({
      "@type": "CollectionPage",
      url: "https://fontus.fr/eau-robinet",
    });
    expect(graph[1]?.itemListElement).toHaveLength(2);
  });
});
