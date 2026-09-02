"use client";

import { useSyncExternalStore } from "react";
import { useMessages } from "@/presentation/i18n/useLocale";
import {
  readTheme,
  setStoredTheme,
  subscribeTheme,
} from "@/presentation/theme/theme";

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribeTheme, readTheme, () => "light");
  const messages = useMessages();

  function toggle() {
    setStoredTheme(theme === "dark" ? "light" : "dark");
  }

  const label =
    theme === "dark"
      ? messages.theme.toggleToLight
      : messages.theme.toggleToDark;

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      suppressHydrationWarning
      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-800 shadow-sm hover:border-emerald-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:border-emerald-700"
    >
      {theme === "dark" ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12.4 2.1a.75.75 0 0 1 .76 1.02 7 7 0 1 0 3.72 3.72.75.75 0 0 1 1.02.76A8.5 8.5 0 1 1 12.4 2.1Z"
      />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5" aria-hidden="true">
      <path
        fill="currentColor"
        d="M10 4.25a.75.75 0 0 1 .75-.75h.01a.75.75 0 0 1 0 1.5H10.75A.75.75 0 0 1 10 4.25Zm0 11.5a.75.75 0 0 1 .75.75h.01a.75.75 0 0 1 0 1.5H10.75a.75.75 0 0 1-.75-.75ZM4.25 10a.75.75 0 0 1-.75.75v.01a.75.75 0 0 1-1.5 0V10.75A.75.75 0 0 1 4.25 10Zm13.5 0a.75.75 0 0 1-.75.75h-.01a.75.75 0 0 1 0-1.5h.01a.75.75 0 0 1 .75.75ZM5.4 5.4a.75.75 0 0 1 0 1.06l-.01.01a.75.75 0 1 1-1.06-1.06l.01-.01A.75.75 0 0 1 5.4 5.4Zm10.26 10.26a.75.75 0 0 1 0 1.06l-.01.01a.75.75 0 1 1-1.06-1.06l.01-.01a.75.75 0 0 1 1.06 0ZM5.4 14.6a.75.75 0 0 1 1.06 0l.01.01a.75.75 0 1 1-1.06 1.06l-.01-.01a.75.75 0 0 1 0-1.06Zm10.26-10.26a.75.75 0 0 1 1.06 0l.01.01a.75.75 0 1 1-1.06 1.06l-.01-.01a.75.75 0 0 1 0-1.06ZM10 6.5A3.5 3.5 0 1 1 10 13.5 3.5 3.5 0 0 1 10 6.5Z"
      />
    </svg>
  );
}
