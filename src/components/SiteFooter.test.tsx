/** @vitest-environment happy-dom */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SiteFooter } from "./SiteFooter";

describe("SiteFooter", () => {
  it("links to the legal pages", () => {
    render(<SiteFooter />);
    expect(screen.getByRole("link", { name: "Accueil" }).getAttribute("href")).toBe(
      "/",
    );
    expect(
      screen.getByRole("link", { name: "Grandes villes" }).getAttribute("href"),
    ).toBe("/eau-robinet");
    expect(
      screen.getByRole("link", { name: "Mentions légales" }).getAttribute("href"),
    ).toBe("/mentions-legales");
    expect(
      screen.getByRole("link", { name: "Confidentialité" }).getAttribute("href"),
    ).toBe("/confidentialite");
    expect(
      screen.getByRole("link", { name: "FAQ" }).getAttribute("href"),
    ).toBe("/faq");
    expect(
      screen.getByRole("link", { name: "Glossaire" }).getAttribute("href"),
    ).toBe("/glossaire");
    expect(
      screen.getByRole("link", { name: "PFAS" }).getAttribute("href"),
    ).toBe("/parametres/pfas");
    expect(
      screen.getByRole("link", { name: "Soutenir" }).getAttribute("href"),
    ).toBe("https://buymeacoffee.com/nayanchauvg");
  });
});
