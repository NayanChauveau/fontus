/** @vitest-environment happy-dom */

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => undefined }),
}));

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

vi.mock("@/components/AddressSearch", () => ({
  AddressSearch: () => <div>address-search</div>,
}));

describe("city page", () => {
  it("renders the same search results page as home, with the city title", async () => {
    const page = await import("./page");
    render(await page.default({ params: Promise.resolve({ slug: "toulouse" }) }));
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Qualité de l’eau du robinet à Toulouse",
      }),
    ).toBeTruthy();
    expect(screen.getByText("address-search")).toBeTruthy();
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Comment consulter la qualité de l’eau du robinet",
      }),
    ).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Grandes villes" })).toBeNull();
    expect(screen.queryByRole("link", { name: "TOULOUSE CENTRE" })).toBeNull();
    expect(
      screen.getByRole("link", { name: "Voir les grandes villes" }).getAttribute(
        "href",
      ),
    ).toBe("/eau-robinet");
    expect(
      JSON.parse(
        document.querySelector('script[type="application/ld+json"]')
          ?.textContent ?? "",
      )[0],
    ).toMatchObject({
      "@type": "WebPage",
      url: "https://fontus.fr/eau-robinet/toulouse",
      about: { name: "Toulouse" },
    });
    await expect(
      page.generateMetadata({ params: Promise.resolve({ slug: "toulouse" }) }),
    ).resolves.toMatchObject({
      title: "Qualité de l’eau du robinet à Toulouse",
      description:
        "Réseaux de distribution (UDI) et analyses officielles de l’eau du robinet à Toulouse (Haute-Garonne, 31555).",
      alternates: { canonical: "/eau-robinet/toulouse" },
      openGraph: {
        title: "Qualité de l’eau du robinet à Toulouse",
        url: "/eau-robinet/toulouse",
      },
      twitter: {
        title: "Qualité de l’eau du robinet à Toulouse",
      },
    });
    expect(page.generateStaticParams()).toEqual(
      expect.arrayContaining([{ slug: "paris" }, { slug: "toulouse" }]),
    );
    expect(page.generateStaticParams()).toHaveLength(50);
  });

  it("calls notFound for an unknown slug", async () => {
    const page = await import("./page");
    await expect(
      page.default({ params: Promise.resolve({ slug: "unknown" }) }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });
});
