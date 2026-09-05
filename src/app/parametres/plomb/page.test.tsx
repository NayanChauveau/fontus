/** @vitest-environment happy-dom */

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => undefined }),
}));

describe("lead page", () => {
  it("renders one h1, the current limit and the 2036 tightening", async () => {
    const page = await import("./page");
    render(await page.default());
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Plomb dans l’eau du robinet",
      }),
    ).toBeTruthy();
    expect(screen.getByText(/10 µg\/L/)).toBeTruthy();
    expect(screen.getByText(/5 µg\/L/)).toBeTruthy();
    expect(screen.getByText(/12 janvier 2036/)).toBeTruthy();
    await expect(page.generateMetadata()).resolves.toMatchObject({
      alternates: { canonical: "/parametres/plomb" },
    });
  });
});
