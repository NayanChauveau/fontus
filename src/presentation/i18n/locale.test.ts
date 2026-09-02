/** @vitest-environment happy-dom */

import { afterEach, describe, expect, it, vi } from "vitest";
import {
  applyLocale,
  readLocale,
  resolveLocale,
  setStoredLocale,
  subscribeLocale,
} from "./locale";
import { catalogs, getMessages, intlLocale, isLocale } from "./messages";

function catalogKeys(value: unknown, prefix = ""): string[] {
  if (typeof value !== "object" || value === null) {
    return [prefix.slice(0, -1)];
  }
  return Object.entries(value).flatMap(([key, nested]) =>
    catalogKeys(nested, `${prefix}${key}.`),
  );
}

describe("locale", () => {
  afterEach(() => {
    window.localStorage.clear();
    document.documentElement.lang = "fr";
  });

  it("accepts only fr and en", () => {
    expect(isLocale("fr")).toBe(true);
    expect(isLocale("en")).toBe(true);
    expect(isLocale("de")).toBe(false);
    expect(isLocale(null)).toBe(false);
    expect(resolveLocale("en")).toBe("en");
    expect(resolveLocale("de")).toBe("fr");
  });

  it("exposes english messages and an intl locale", () => {
    expect(catalogKeys(catalogs.en)).toEqual(catalogKeys(catalogs.fr));
    expect(getMessages("en").home.title).toBe("Tap water quality");
    expect(intlLocale("en")).toBe("en-GB");
    expect(intlLocale("fr")).toBe("fr-FR");
  });

  it("persists the locale and notifies subscribers", () => {
    window.localStorage.clear();
    expect(readLocale()).toBe("fr");
    const listener = vi.fn();
    const unsubscribe = subscribeLocale(listener);
    setStoredLocale("en");
    expect(window.localStorage.getItem("eau-robinet-locale")).toBe("en");
    expect(document.documentElement.lang).toBe("en");
    expect(readLocale()).toBe("en");
    expect(listener).toHaveBeenCalledOnce();
    unsubscribe();
    applyLocale("fr");
    expect(document.documentElement.lang).toBe("fr");
    setStoredLocale("fr");
    expect(listener).toHaveBeenCalledOnce();
  });
});
