"use client";

import Link from "next/link";
import { LanguageSelect } from "@/components/LanguageSelect";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useMessages } from "@/presentation/i18n/useLocale";

export function SiteHeader() {
  const messages = useMessages();

  return (
    <header className="border-b border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
        <Link
          href="/"
          className="text-lg font-semibold tracking-tight text-zinc-950 no-underline dark:text-zinc-50"
        >
          <span>{messages.home.title}</span>
        </Link>
        <div className="flex shrink-0 items-center gap-2">
          <LanguageSelect />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
