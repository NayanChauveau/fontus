/** @vitest-environment happy-dom */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { HomeHeader } from "./HomeHeader";

vi.mock("./ThemeToggle", () => ({
  ThemeToggle: () => <button type="button">theme-toggle</button>,
}));

describe("HomeHeader", () => {
  afterEach(() => {
    cleanup();
    window.localStorage.clear();
    document.documentElement.lang = "fr";
  });

  it("switches the title when the language changes", () => {
    render(<HomeHeader />);
    expect(
      screen.getByRole("heading", { name: "Qualité de l’eau du robinet" }),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole("radio", { name: "English" }));
    expect(
      screen.getByRole("heading", { name: "Tap water quality" }),
    ).toBeTruthy();
  });
});
