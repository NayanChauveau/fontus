/** @vitest-environment happy-dom */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { LOCALE_STORAGE_KEY } from "@/presentation/i18n/locale";
import { LanguageSelect } from "./LanguageSelect";

describe("LanguageSelect", () => {
  afterEach(() => {
    cleanup();
    window.localStorage.clear();
    document.documentElement.lang = "fr";
  });

  it("defaults to french then persists english", () => {
    render(<LanguageSelect />);
    expect(screen.getByRole("radiogroup", { name: "Langue" })).toBeTruthy();
    expect(
      screen.getByRole("radio", { name: "Français" }).getAttribute(
        "aria-checked",
      ),
    ).toBe("true");

    fireEvent.click(screen.getByRole("radio", { name: "English" }));
    expect(window.localStorage.getItem(LOCALE_STORAGE_KEY)).toBe("en");
    expect(document.cookie).toContain("eau-robinet-locale=en");
    expect(document.documentElement.lang).toBe("en");
    expect(screen.getByRole("radiogroup", { name: "Language" })).toBeTruthy();
    expect(
      screen.getByRole("radio", { name: "English" }).getAttribute(
        "aria-checked",
      ),
    ).toBe("true");

    fireEvent.keyDown(screen.getByRole("radiogroup"), { key: "ArrowLeft" });
    expect(window.localStorage.getItem(LOCALE_STORAGE_KEY)).toBe("fr");
    fireEvent.keyDown(screen.getByRole("radiogroup"), { key: "ArrowRight" });
    expect(window.localStorage.getItem(LOCALE_STORAGE_KEY)).toBe("en");
    fireEvent.keyDown(screen.getByRole("radiogroup"), { key: "ArrowDown" });
    expect(window.localStorage.getItem(LOCALE_STORAGE_KEY)).toBe("fr");
    fireEvent.keyDown(screen.getByRole("radiogroup"), { key: "ArrowUp" });
    expect(window.localStorage.getItem(LOCALE_STORAGE_KEY)).toBe("en");
  });
});
