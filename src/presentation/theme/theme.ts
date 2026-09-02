export const THEME_STORAGE_KEY = "eau-robinet-theme";

export type ColorTheme = "light" | "dark";

const listeners = new Set<() => void>();

export function resolveTheme(
  stored: string | null,
  systemDark: boolean,
): ColorTheme {
  if (stored === "light" || stored === "dark") {
    return stored;
  }
  return systemDark ? "dark" : "light";
}

export function applyTheme(theme: ColorTheme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
}

export function readTheme(): ColorTheme {
  return resolveTheme(
    window.localStorage.getItem(THEME_STORAGE_KEY),
    window.matchMedia("(prefers-color-scheme: dark)").matches,
  );
}

export function subscribeTheme(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function setStoredTheme(theme: ColorTheme) {
  window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  applyTheme(theme);
  for (const listener of listeners) {
    listener();
  }
}

export const THEME_BOOTSTRAP_SCRIPT = `(function(){try{var s=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});var d=s==="dark"||(s!=="light"&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d);}catch(e){}})();`;
