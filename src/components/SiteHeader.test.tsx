/** @vitest-environment happy-dom */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SiteHeader } from "./SiteHeader";

vi.mock("./ThemeToggle", () => ({
  ThemeToggle: () => <button type="button">theme-toggle</button>,
}));

describe("SiteHeader", () => {
  afterEach(() => {
    cleanup();
    window.localStorage.clear();
    document.documentElement.lang = "fr";
  });

  it("uses the brand as a link, not a heading", () => {
    render(<SiteHeader />);
    expect(screen.queryByRole("heading")).toBeNull();
    expect(screen.getByRole("link", { name: "Fontus" }).getAttribute("href")).toBe(
      "/",
    );
    expect(screen.getByRole("radio", { name: "Français" })).toBeTruthy();
    fireEvent.click(screen.getByRole("radio", { name: "English" }));
    expect(screen.getByRole("link", { name: "Fontus" })).toBeTruthy();
    expect(screen.getByRole("radio", { name: "English" })).toBeTruthy();
  });
});
