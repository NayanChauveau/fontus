/** @vitest-environment happy-dom */

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => undefined }),
}));

vi.mock("next/navigation", () => ({
  permanentRedirect: (url: string) => {
    throw new Error(`REDIRECT:${url}`);
  },
}));

vi.mock("@/components/AddressSearch", () => ({
  AddressSearch: () => <div>address-search</div>,
}));

describe("Home page", () => {
  it("renders a single keyword heading", async () => {
    const { default: Home, generateMetadata } = await import("./page");
    render(await Home());
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Qualité de l’eau du robinet en France",
      }),
    ).toBeTruthy();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.queryByRole("heading", { name: "Fontus" })).toBeNull();
    expect(screen.getByText("address-search")).toBeTruthy();
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Comment consulter la qualité de l’eau du robinet",
      }),
    ).toBeTruthy();
    expect(document.getElementById("contenu")).toBeTruthy();
    await expect(
      generateMetadata({ searchParams: Promise.resolve({}) }),
    ).resolves.toEqual({
      alternates: { canonical: "/" },
      robots: undefined,
    });
  });

  it("noindexes share queries", async () => {
    const { generateMetadata } = await import("./page");
    await expect(
      generateMetadata({
        searchParams: Promise.resolve({ insee: "81004" }),
      }),
    ).resolves.toMatchObject({
      alternates: { canonical: "/" },
      robots: { index: false, follow: true },
    });
    await expect(
      generateMetadata({
        searchParams: Promise.resolve({ udi: "081004110" }),
      }),
    ).resolves.toMatchObject({
      robots: { index: false, follow: true },
    });
  });

  it("sends catalog communes to the city pages", async () => {
    const { default: Home } = await import("./page");
    await expect(
      Home({ searchParams: Promise.resolve({ insee: "31555" }) }),
    ).rejects.toThrow("REDIRECT:/eau-robinet/toulouse");
    await expect(
      Home({
        searchParams: Promise.resolve({
          insee: "31555",
          udi: "031000006",
        }),
      }),
    ).rejects.toThrow("REDIRECT:/eau-robinet/toulouse/031000006");
    await expect(
      Home({ searchParams: Promise.resolve({ insee: "75108" }) }),
    ).rejects.toThrow("REDIRECT:/eau-robinet/paris");
    await expect(
      Home({
        searchParams: Promise.resolve({
          insee: "31555",
          adresse: "55 Avenue Pierre Molette 31100 Toulouse",
        }),
      }),
    ).rejects.toThrow(
      "REDIRECT:/eau-robinet/toulouse?adresse=55+Avenue+Pierre+Molette+31100+Toulouse",
    );
  });
});
