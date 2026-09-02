"use client";

import { setStoredLocale } from "@/presentation/i18n/locale";
import type { Locale } from "@/presentation/i18n/messages";
import { useLocale, useMessages } from "@/presentation/i18n/useLocale";

const OPTIONS: { value: Locale; short: string }[] = [
  { value: "fr", short: "FR" },
  { value: "en", short: "EN" },
];

export function LanguageSelect() {
  const locale = useLocale();
  const messages = useMessages();

  return (
    <div
      role="group"
      aria-label={messages.locale.label}
      className="inline-flex h-10 items-center rounded-xl border border-zinc-200 bg-white p-1 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
    >
      {OPTIONS.map((option) => {
        const selected = option.value === locale;
        const name =
          option.value === "fr"
            ? messages.locale.french
            : messages.locale.english;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            aria-label={name}
            title={name}
            onClick={() => {
              setStoredLocale(option.value);
            }}
            className={`inline-flex h-8 min-w-9 items-center justify-center rounded-lg px-2.5 text-xs font-semibold tracking-wide transition-colors ${
              selected
                ? "bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950"
                : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100"
            }`}
          >
            {option.short}
          </button>
        );
      })}
    </div>
  );
}
