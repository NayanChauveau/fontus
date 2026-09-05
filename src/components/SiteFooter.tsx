"use client";

import Link from "next/link";
import { useMessages } from "@/presentation/i18n/useLocale";

export function SiteFooter() {
  const messages = useMessages();

  return (
    <footer className="mt-auto border-t border-zinc-200 px-4 py-4 text-center text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
      <nav className="flex justify-center gap-4">
        <Link
          href="/mentions-legales"
          className="underline-offset-2 hover:underline"
        >
          {messages.legal.mentions}
        </Link>
        <Link
          href="/confidentialite"
          className="underline-offset-2 hover:underline"
        >
          {messages.legal.privacy}
        </Link>
      </nav>
    </footer>
  );
}
