/** @vitest-environment happy-dom */

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

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

async function renderUdi(slug: string, udi: string) {
  const layout = await import("../layout");
  const page = await import("./page");
  const params = Promise.resolve({ slug, udi });
  render(
    await layout.default({
      children: await page.default({ params }),
      params: Promise.resolve({ slug }),
    }),
  );
  return page;
}

describe("city UDI page", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders the same search results page as the city page", async () => {
    const page = await renderUdi("toulouse", "031000123");
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
    expect(screen.queryByRole("link", { name: "Toulouse" })).toBeNull();
    await expect(
      page.generateMetadata({
        params: Promise.resolve({ slug: "toulouse", udi: "031000123" }),
      }),
    ).resolves.toMatchObject({
      title: "Qualité de l’eau du robinet à Toulouse",
      alternates: { canonical: "/eau-robinet/toulouse" },
      openGraph: { url: "/eau-robinet/toulouse" },
    });
  });

  it("does not 404 a valid UDI that is not checked against the commune", async () => {
    await renderUdi("toulouse", "099000000");
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Qualité de l’eau du robinet à Toulouse",
      }),
    ).toBeTruthy();
  });

  it("returns empty metadata when the city or UDI is unknown", async () => {
    const page = await import("./page");
    await expect(
      page.generateMetadata({
        params: Promise.resolve({ slug: "unknown", udi: "031000123" }),
      }),
    ).resolves.toEqual({});
    await expect(
      page.generateMetadata({
        params: Promise.resolve({ slug: "toulouse", udi: "not-a-udi" }),
      }),
    ).resolves.toEqual({});
  });

  it("calls notFound for an invalid UDI code", async () => {
    const page = await import("./page");
    await expect(
      page.default({
        params: Promise.resolve({ slug: "toulouse", udi: "not-a-udi" }),
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("calls notFound for an unknown city", async () => {
    const page = await import("./page");
    await expect(
      page.default({
        params: Promise.resolve({ slug: "unknown", udi: "031000123" }),
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });
});
