/** @vitest-environment happy-dom */

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Home, { generateMetadata } from "./page";

vi.mock("@/components/AddressSearch", () => ({
  AddressSearch: () => <div>address-search</div>,
}));

vi.mock("@/components/HomeHeader", () => ({
  HomeHeader: () => <h1>home-header</h1>,
}));

describe("Home page", () => {
  it("renders the title", () => {
    render(<Home />);
    expect(screen.getByRole("heading", { level: 1 })).toBeTruthy();
    expect(screen.getByText("address-search")).toBeTruthy();
    expect(screen.getByText("home-header")).toBeTruthy();
    expect(document.getElementById("contenu")).toBeTruthy();
  });

  it("keeps the clean home indexable and noindexes share queries", async () => {
    await expect(
      generateMetadata({ searchParams: Promise.resolve({}) }),
    ).resolves.toEqual({
      alternates: { canonical: "/" },
      robots: undefined,
    });
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
});
