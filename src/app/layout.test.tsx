/** @vitest-environment happy-dom */

import { render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const cookieValue = { current: undefined as string | undefined };
const nonceValue = { current: null as string | null };

vi.mock("next/font/google", () => ({
  Geist: () => ({ variable: "geist" }),
  Geist_Mono: () => ({ variable: "geist-mono" }),
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: () =>
      cookieValue.current ? { value: cookieValue.current } : undefined,
  }),
  headers: async () =>
    new Headers(nonceValue.current ? { "x-nonce": nonceValue.current } : {}),
}));

describe("RootLayout", () => {
  it("gives the theme and language bootstrap script the request's CSP nonce", async () => {
    cookieValue.current = undefined;
    nonceValue.current = "bm9uY2UtZm9yLXRlc3Q=";
    vi.resetModules();
    const { default: RootLayout } = await import("./layout");
    const markup = renderToStaticMarkup(
      await RootLayout({ children: <div>child</div> }),
    );
    nonceValue.current = null;
    expect(markup).toContain('<script nonce="bm9uY2UtZm9yLXRlc3Q=">');
    // JSON-LD is a data block: the browser never runs it, so it needs no nonce.
    expect(markup).toContain('<script type="application/ld+json">');
  });

  it("wraps children in a french document by default", async () => {
    cookieValue.current = undefined;
    const { default: RootLayout, generateMetadata, viewport } = await import(
      "./layout"
    );
    const ui = await RootLayout({
      children: <div>child</div>,
    });
    render(ui);
    expect(screen.getByText("child")).toBeTruthy();
    expect(document.documentElement.lang).toBe("fr");
    expect(document.head.textContent).toContain("eau-robinet-theme");
    expect(document.head.textContent).toContain("eau-robinet-locale");
    expect(screen.getByRole("link", { name: "Fontus" }).getAttribute("href")).toBe(
      "/",
    );
    expect(screen.queryByRole("heading")).toBeNull();
    expect(screen.getByRole("link", { name: "Mentions légales" })).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Aller au contenu" }).getAttribute("href"),
    ).toBe("#contenu");
    expect(
      document.querySelector('script[type="application/ld+json"]')?.textContent,
    ).toContain("WebSite");
    expect(viewport.themeColor).toBe("#0369a1");
    await expect(generateMetadata()).resolves.toMatchObject({
      metadataBase: new URL("https://fontus.fr"),
      title: {
        default: "Qualité de l’eau du robinet en France",
        template: "%s | Fontus",
      },
      robots: { index: true, follow: true },
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
    expect(screen.getByRole("link", { name: "Skip to content" })).toBeTruthy();
    await expect(generateMetadata()).resolves.toMatchObject({
      title: {
        default: "Tap water quality in France",
        template: "%s | Fontus",
      },
      openGraph: { locale: "en_GB" },
    });
  });
});
