import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { findCityBySlug } from "@/application/cities/largestCities";
import { SearchResults } from "@/components/SearchResults";
import { cityPageCopy } from "@/presentation/cities/cityPageCopy";
import { requestMessages } from "@/presentation/i18n/requestLocale";

export default async function CityResultsLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const city = findCityBySlug(slug);
  if (!city) {
    notFound();
  }

  const messages = await requestMessages();
  const copy = cityPageCopy(messages, city);

  return (
    <>
      {children}
      <SearchResults
        title={copy.title}
        description={copy.description}
        messages={messages}
        communeName={city.name}
      />
    </>
  );
}
