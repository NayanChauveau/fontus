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
      screen.getByRole("link", { name: "Mentions légales" }).getAttribute("href"),
    ).toBe("/mentions-legales");
    expect(
      screen.getByRole("link", { name: "Confidentialité" }).getAttribute("href"),
    ).toBe("/confidentialite");
  });
});
