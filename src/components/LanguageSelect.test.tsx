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
    expect(screen.getByRole("group", { name: "Langue" })).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Français" }).getAttribute(
        "aria-pressed",
      ),
    ).toBe("true");

    fireEvent.click(screen.getByRole("button", { name: "English" }));
    expect(window.localStorage.getItem(LOCALE_STORAGE_KEY)).toBe("en");
    expect(document.documentElement.lang).toBe("en");
    expect(screen.getByRole("group", { name: "Language" })).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "English" }).getAttribute(
        "aria-pressed",
      ),
    ).toBe("true");
  });
});
