/** @vitest-environment happy-dom */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { THEME_STORAGE_KEY } from "@/presentation/theme/theme";
import { ThemeToggle } from "./ThemeToggle";

describe("ThemeToggle", () => {
  afterEach(() => {
    cleanup();
    window.localStorage.clear();
    document.documentElement.classList.remove("dark");
    vi.unstubAllGlobals();
  });

  it("starts from the system preference then toggles and persists", () => {
    window.localStorage.removeItem(THEME_STORAGE_KEY);
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({ matches: true })),
    );

    render(<ThemeToggle />);
    fireEvent.click(screen.getByRole("button", { name: "Passer en mode clair" }));
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
    expect(screen.getByRole("button", { name: "Passer en mode sombre" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Passer en mode sombre" }));
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
  });

  it("honors a stored light theme even if the system is dark", () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, "light");
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({ matches: true })),
    );

    render(<ThemeToggle />);
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(screen.getByRole("button", { name: "Passer en mode sombre" })).toBeTruthy();
  });
});
