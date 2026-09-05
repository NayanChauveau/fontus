import type { Metadata } from "next";
import { Suspense } from "react";
import { AddressSearch } from "@/components/AddressSearch";
import { requestMessages } from "@/presentation/i18n/requestLocale";
import { hasShareQueryParams } from "@/presentation/shareSearch";

type HomeSearchParams = Promise<{
  insee?: string | string[];
  udi?: string | string[];
}>;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: HomeSearchParams;
}): Promise<Metadata> {
  const params = await searchParams;
  return {
    alternates: { canonical: "/" },
    robots: hasShareQueryParams(params)
      ? { index: false, follow: true }
      : undefined,
  };
}

export default async function Home() {
  const messages = await requestMessages();
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center bg-zinc-50 px-4 py-6 font-sans md:px-6 md:py-16 dark:bg-zinc-950">
      <main
        id="contenu"
        className="flex w-full min-w-0 max-w-6xl flex-1 flex-col gap-6 rounded-2xl bg-white p-5 shadow-sm md:gap-8 md:p-8 dark:bg-zinc-900"
      >
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            {messages.home.metaTitle}
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {messages.home.description}
          </p>
        </div>
        <Suspense>
          <AddressSearch />
        </Suspense>
      </main>
    </div>
  );
}
