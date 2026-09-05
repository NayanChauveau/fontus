/** @vitest-environment happy-dom */

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LARGEST_CITIES } from "@/application/cities/largestCities";

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => undefined }),
}));

describe("city hub page", () => {
  it("renders one h1 and a link for each catalog city", async () => {
    const page = await import("./page");
    render(await page.default());
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Qualité de l’eau du robinet dans les grandes villes",
      }),
    ).toBeTruthy();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(
      screen.getByRole("link", { name: "Paris" }).getAttribute("href"),
    ).toBe("/eau-robinet/paris");
    expect(screen.getAllByRole("link").filter((link) =>
      (link.getAttribute("href") ?? "").startsWith("/eau-robinet/"),
    )).toHaveLength(LARGEST_CITIES.length);
    expect(
      JSON.parse(
        document.querySelector('script[type="application/ld+json"]')
          ?.textContent ?? "",
      )[0],
    ).toMatchObject({
      "@type": "CollectionPage",
      url: "https://fontus.fr/eau-robinet",
    });
    await expect(page.generateMetadata()).resolves.toMatchObject({
      title: "Qualité de l’eau du robinet dans les grandes villes",
      alternates: { canonical: "/eau-robinet" },
      openGraph: {
        title: "Qualité de l’eau du robinet dans les grandes villes",
        url: "/eau-robinet",
      },
    });
  });
});
