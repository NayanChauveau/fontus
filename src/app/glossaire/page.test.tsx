/** @vitest-environment happy-dom */

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => undefined }),
}));

describe("glossary page", () => {
  it("renders one h1 and definition terms", async () => {
    const page = await import("./page");
    render(await page.default());
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Glossaire de l’eau du robinet",
      }),
    ).toBeTruthy();
    expect(screen.getByText("UDI")).toBeTruthy();
    expect(screen.getByText("SISE-Eaux")).toBeTruthy();
    await expect(page.generateMetadata()).resolves.toMatchObject({
      alternates: { canonical: "/glossaire" },
    });
  });
});
