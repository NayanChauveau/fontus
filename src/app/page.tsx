import type { Metadata } from "next";
import { Suspense } from "react";
import { AddressSearch } from "@/components/AddressSearch";
import { HomeHeader } from "@/components/HomeHeader";
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

export default function Home() {
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center bg-zinc-50 px-4 py-6 font-sans md:px-6 md:py-16 dark:bg-zinc-950">
      <main
        id="contenu"
        className="flex w-full min-w-0 max-w-6xl flex-1 flex-col gap-6 rounded-2xl bg-white p-5 shadow-sm md:gap-8 md:p-8 dark:bg-zinc-900"
      >
        <HomeHeader />
        <Suspense>
          <AddressSearch />
        </Suspense>
      </main>
    </div>
  );
}
