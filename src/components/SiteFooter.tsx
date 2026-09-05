"use client";

import Link from "next/link";
import {
  FAQ_PATH,
  GLOSSARY_PATH,
  HOW_TO_READ_PATH,
  LEAD_PATH,
  NITRATES_PATH,
  PFAS_PATH,
} from "@/presentation/editorial/paths";
import { useMessages } from "@/presentation/i18n/useLocale";

export function SiteFooter() {
  const messages = useMessages();

  return (
    <footer className="mt-auto border-t border-zinc-200 px-4 py-4 text-center text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
      <nav className="flex flex-wrap justify-center gap-x-4 gap-y-2">
        <Link href="/" className="underline-offset-2 hover:underline">
          {messages.nav.home}
        </Link>
        <Link href={HOW_TO_READ_PATH} className="underline-offset-2 hover:underline">
          {messages.nav.howToRead}
        </Link>
        <Link href={FAQ_PATH} className="underline-offset-2 hover:underline">
          {messages.nav.faq}
        </Link>
        <Link href={GLOSSARY_PATH} className="underline-offset-2 hover:underline">
          {messages.nav.glossary}
        </Link>
        <Link href={PFAS_PATH} className="underline-offset-2 hover:underline">
          {messages.nav.pfas}
        </Link>
        <Link href={NITRATES_PATH} className="underline-offset-2 hover:underline">
          {messages.nav.nitrates}
        </Link>
        <Link href={LEAD_PATH} className="underline-offset-2 hover:underline">
          {messages.nav.lead}
        </Link>
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
