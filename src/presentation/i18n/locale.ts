import { isLocale, type Locale } from "./messages";

export const LOCALE_STORAGE_KEY = "eau-robinet-locale";

const listeners = new Set<() => void>();

export function resolveLocale(stored: string | null): Locale {
  return isLocale(stored) ? stored : "fr";
}

export function applyLocale(locale: Locale) {
  document.documentElement.lang = locale;
}

export function readLocale(): Locale {
  return resolveLocale(window.localStorage.getItem(LOCALE_STORAGE_KEY));
}

export function subscribeLocale(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function setStoredLocale(locale: Locale) {
  window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  applyLocale(locale);
  for (const listener of listeners) {
    listener();
  }
}

export const LOCALE_BOOTSTRAP_SCRIPT = `(function(){try{var s=localStorage.getItem(${JSON.stringify(LOCALE_STORAGE_KEY)});if(s==="en"||s==="fr")document.documentElement.lang=s;}catch(e){}})();`;
