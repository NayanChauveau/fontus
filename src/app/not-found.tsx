import Link from "next/link";
import { requestMessages } from "@/presentation/i18n/requestLocale";

export default async function NotFound() {
  const messages = await requestMessages();
  return (
    <main
      id="contenu"
      className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-4 py-16 font-sans"
    >
      <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
        {messages.notFound.title}
      </h1>
      <Link
        href="/"
        className="text-sm font-medium text-emerald-800 underline-offset-2 hover:underline dark:text-emerald-300"
      >
        {messages.notFound.home}
      </Link>
    </main>
  );
}
