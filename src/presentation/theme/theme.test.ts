/** @vitest-environment happy-dom */

import { describe, expect, it, vi } from "vitest";
import {
  applyTheme,
  readTheme,
  resolveTheme,
  setStoredTheme,
  subscribeTheme,
} from "./theme";

describe("resolveTheme", () => {
  it("prefers an explicit stored choice over the system", () => {
    expect(resolveTheme("light", true)).toBe("light");
    expect(resolveTheme("dark", false)).toBe("dark");
  });

  it("follows the system when nothing is stored", () => {
    expect(resolveTheme(null, true)).toBe("dark");
    expect(resolveTheme("auto", false)).toBe("light");
  });
});

describe("applyTheme", () => {
  it("toggles the dark class on the document element", () => {
    applyTheme("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    applyTheme("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });
});

describe("readTheme / setStoredTheme", () => {
  it("reads the system preference then persists an explicit choice", () => {
    window.localStorage.clear();
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({ matches: true })),
    );

    expect(readTheme()).toBe("dark");
    setStoredTheme("light");
    expect(window.localStorage.getItem("eau-robinet-theme")).toBe("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(readTheme()).toBe("light");
    const listener = vi.fn();
    const unsubscribe = subscribeTheme(listener);
    setStoredTheme("dark");
    expect(listener).toHaveBeenCalledOnce();
    unsubscribe();
    setStoredTheme("light");
    expect(listener).toHaveBeenCalledOnce();
    vi.unstubAllGlobals();
  });
});
