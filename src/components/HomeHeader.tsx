"use client";

import { LanguageSelect } from "@/components/LanguageSelect";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useMessages } from "@/presentation/i18n/useLocale";

export function HomeHeader() {
  const messages = useMessages();

  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          {messages.home.title}
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          {messages.home.description}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <LanguageSelect />
        <ThemeToggle />
      </div>
    </div>
  );
}
