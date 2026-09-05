/** @vitest-environment happy-dom */

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => undefined }),
}));

describe("faq page", () => {
  it("renders one h1, questions and FAQ JSON-LD", async () => {
    const page = await import("./page");
    render(await page.default());
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Questions fréquentes sur l’eau du robinet",
      }),
    ).toBeTruthy();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "L’eau du robinet est-elle potable ?",
      }),
    ).toBeTruthy();
    expect(
      document.querySelector('script[type="application/ld+json"]')?.textContent,
    ).toContain("FAQPage");
    expect(
      screen.getByRole("link", { name: "Voir les analyses de votre commune" }).getAttribute(
        "href",
      ),
    ).toBe("/");
    await expect(page.generateMetadata()).resolves.toMatchObject({
      title: "Questions fréquentes sur l’eau du robinet",
      alternates: { canonical: "/faq" },
    });
  });
});
