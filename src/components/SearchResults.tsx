import { Suspense } from "react";
import { AddressSearch } from "@/components/AddressSearch";
import { HomeGuide } from "@/components/HomeGuide";
import type { Messages } from "@/presentation/i18n/messages";

export function SearchResults({
  title,
  description,
  messages,
  communeName,
}: {
  title: string;
  description: string;
  messages: Messages;
  communeName?: string;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center bg-zinc-50 px-4 py-6 font-sans md:px-6 md:py-16 dark:bg-zinc-950">
      <main
        id="contenu"
        className="flex w-full min-w-0 max-w-6xl flex-1 flex-col gap-6 rounded-2xl bg-white p-5 shadow-sm md:gap-8 md:p-8 dark:bg-zinc-900"
      >
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            {title}
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {description}
          </p>
        </div>
        <Suspense>
          <AddressSearch initialCommuneName={communeName} />
        </Suspense>
        <HomeGuide messages={messages} />
      </main>
    </div>
  );
}
