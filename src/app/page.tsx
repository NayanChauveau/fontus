import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";
import { SearchResults } from "@/components/SearchResults";
import { requestMessages } from "@/presentation/i18n/requestLocale";
import {
  firstSearchParam,
  hasShareQueryParams,
  pathForShare,
} from "@/presentation/shareSearch";

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

export default async function Home({
  searchParams,
}: {
  searchParams?: HomeSearchParams;
} = {}) {
  const params = searchParams ? await searchParams : {};
  const catalogPath = pathForShare({
    citycode: firstSearchParam(params.insee),
    networkCode: firstSearchParam(params.udi),
  });
  if (catalogPath.startsWith("/eau-robinet")) {
    permanentRedirect(catalogPath);
  }

  const messages = await requestMessages();
  return (
    <SearchResults
      title={messages.home.metaTitle}
      description={messages.home.description}
      messages={messages}
    />
  );
}
