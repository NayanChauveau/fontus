/** @vitest-environment happy-dom */

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const cookieValue = { current: undefined as string | undefined };

vi.mock("next/font/google", () => ({
  Geist: () => ({ variable: "geist" }),
  Geist_Mono: () => ({ variable: "geist-mono" }),
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: () =>
      cookieValue.current ? { value: cookieValue.current } : undefined,
  }),
}));

describe("RootLayout", () => {
  it("wraps children in a french document by default", async () => {
    cookieValue.current = undefined;
    const { default: RootLayout, generateMetadata } = await import("./layout");
    const ui = await RootLayout({
      children: <div>child</div>,
    });
    render(ui);
    expect(screen.getByText("child")).toBeTruthy();
    expect(document.documentElement.lang).toBe("fr");
    expect(document.head.textContent).toContain("eau-robinet-theme");
    expect(document.head.textContent).toContain("eau-robinet-locale");
    expect(screen.getByRole("link", { name: "Mentions légales" })).toBeTruthy();
    await expect(generateMetadata()).resolves.toMatchObject({
      title: "Fontus",
    });
  });

  it("reads the locale cookie for SSR lang and metadata", async () => {
    cookieValue.current = "en";
    vi.resetModules();
    const { default: RootLayout, generateMetadata } = await import("./layout");
    const ui = await RootLayout({
      children: <div>child</div>,
    });
    render(ui);
    expect(document.documentElement.lang).toBe("en");
    await expect(generateMetadata()).resolves.toMatchObject({
      title: "Fontus",
    });
  });
});
