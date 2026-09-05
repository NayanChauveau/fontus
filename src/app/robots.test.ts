import { describe, expect, it } from "vitest";
import robots from "./robots";

describe("robots", () => {
  it("allows pages and blocks the API", () => {
    expect(robots()).toEqual({
      rules: {
        userAgent: "*",
        allow: "/",
        disallow: "/api/",
      },
      sitemap: "https://fontus.fr/sitemap.xml",
      host: "https://fontus.fr",
    });
  });
});
