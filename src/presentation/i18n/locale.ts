import { isLocale, type Locale } from "./messages";

export const LOCALE_STORAGE_KEY = "eau-robinet-locale";
export const LOCALE_COOKIE_NAME = "eau-robinet-locale";

const listeners = new Set<() => void>();

export function resolveLocale(stored: string | null | undefined): Locale {
  const value = stored ?? null;
  return isLocale(value) ? value : "fr";
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

export function persistLocaleCookie(locale: Locale) {
  document.cookie = `${LOCALE_COOKIE_NAME}=${locale}; Path=/; Max-Age=31536000; SameSite=Lax`;
}

export function setStoredLocale(locale: Locale) {
  window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  persistLocaleCookie(locale);
  applyLocale(locale);
  for (const listener of listeners) {
    listener();
  }
}

export const LOCALE_BOOTSTRAP_SCRIPT = `(function(){try{var s=localStorage.getItem(${JSON.stringify(LOCALE_STORAGE_KEY)});if(s==="en"||s==="fr"){document.documentElement.lang=s;document.cookie=${JSON.stringify(LOCALE_COOKIE_NAME)}+"="+s+"; Path=/; Max-Age=31536000; SameSite=Lax";}}catch(e){}})();`;
