import { describe, expect, it } from "vitest";
import { pageSocialMetadata } from "./pageSocialMetadata";

describe("pageSocialMetadata", () => {
  it("reuses the page title and description on Open Graph and Twitter", () => {
    expect(
      pageSocialMetadata({
        title: "Qualité de l’eau du robinet à Toulouse",
        description: "Analyses à Toulouse (Haute-Garonne, 31555).",
        path: "/eau-robinet/toulouse",
        locale: "fr",
      }),
    ).toEqual({
      openGraph: {
        type: "website",
        locale: "fr_FR",
        url: "/eau-robinet/toulouse",
        siteName: "Fontus",
        title: "Qualité de l’eau du robinet à Toulouse",
        description: "Analyses à Toulouse (Haute-Garonne, 31555).",
      },
      twitter: {
        card: "summary",
        title: "Qualité de l’eau du robinet à Toulouse",
        description: "Analyses à Toulouse (Haute-Garonne, 31555).",
      },
    });
  });

  it("uses the English Open Graph locale", () => {
    expect(
      pageSocialMetadata({
        title: "Tap water quality in Toulouse",
        description: "Official analyses in Toulouse.",
        path: "/eau-robinet/toulouse",
        locale: "en",
      }).openGraph?.locale,
    ).toBe("en_GB");
  });
});
