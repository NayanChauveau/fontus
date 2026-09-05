import type { Metadata } from "next";
import { cookies } from "next/headers";
import { LOCALE_COOKIE_NAME, resolveLocale } from "@/presentation/i18n/locale";
import { getMessages } from "@/presentation/i18n/messages";

async function requestMessages() {
  const locale = resolveLocale((await cookies()).get(LOCALE_COOKIE_NAME)?.value);
  return getMessages(locale);
}

export async function generateMetadata(): Promise<Metadata> {
  const messages = await requestMessages();
  return { title: messages.legal.privacyTitle };
}

export default async function ConfidentialitePage() {
  const messages = await requestMessages();
  return (
    <article className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-10 text-sm text-zinc-800 dark:text-zinc-200">
      <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
        {messages.legal.privacyTitle}
      </h1>
      <p>{messages.legal.privacyIntro}</p>
      <p>{messages.legal.privacyAddress}</p>
      <p>{messages.legal.privacyIp}</p>
      <p>{messages.legal.privacyCookie}</p>
      <p>{messages.legal.privacyLogs}</p>
      <p>{messages.legal.privacyContact}</p>
    </article>
  );
}
