/** @vitest-environment happy-dom */

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => undefined }),
}));

describe("how-to-read page", () => {
  it("renders one h1 and the ARS section", async () => {
    const page = await import("./page");
    render(await page.default());
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Comment lire une analyse de l’eau du robinet",
      }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "La conclusion ARS : le verdict légal",
      }),
    ).toBeTruthy();
    await expect(page.generateMetadata()).resolves.toMatchObject({
      alternates: { canonical: "/comment-lire-une-analyse" },
    });
  });
});
