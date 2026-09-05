import type { ReactNode } from "react";
import Link from "next/link";
import type { Messages } from "@/presentation/i18n/messages";

export function EditorialPage({
  messages,
  title,
  crumb,
  children,
}: {
  messages: Messages;
  title: string;
  crumb: string;
  children: ReactNode;
}) {
  return (
    <main
      id="contenu"
      className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-4 py-10 font-sans text-sm text-zinc-800 dark:text-zinc-200"
    >
      <nav aria-label={messages.a11y.breadcrumb} className="text-xs text-zinc-500">
        <Link href="/" className="underline-offset-2 hover:underline">
          {messages.nav.home}
        </Link>
        <span aria-hidden="true"> / </span>
        <span>{crumb}</span>
      </nav>
      <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
        {title}
      </h1>
      {children}
    </main>
  );
}
