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

describe("city results layout", () => {
  it("renders the shared search results for a catalog city", async () => {
    const layout = await import("./layout");
    render(
      await layout.default({
        children: <script type="application/ld+json">[]</script>,
        params: Promise.resolve({ slug: "toulouse" }),
      }),
    );
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Qualité de l’eau du robinet à Toulouse",
      }),
    ).toBeTruthy();
    expect(screen.getByText("address-search")).toBeTruthy();
  });

  it("calls notFound for an unknown slug", async () => {
    const layout = await import("./layout");
    await expect(
      layout.default({
        children: null,
        params: Promise.resolve({ slug: "unknown" }),
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });
});
