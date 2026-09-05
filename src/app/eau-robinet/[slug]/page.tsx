import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { findCityBySlug, LARGEST_CITIES } from "@/application/cities/largestCities";
import { SearchResults } from "@/components/SearchResults";
import { cityPagePath } from "@/presentation/editorial/paths";
import { fillTemplate } from "@/presentation/i18n/fillTemplate";
import { requestMessages } from "@/presentation/i18n/requestLocale";

type CityPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return LARGEST_CITIES.map((city) => ({ slug: city.slug }));
}

export async function generateMetadata({
  params,
}: CityPageProps): Promise<Metadata> {
  const { slug } = await params;
  const city = findCityBySlug(slug);
  if (!city) {
    return {};
  }
  const messages = await requestMessages();
  return {
    title: fillTemplate(messages.pages.city.title, { name: city.name }),
    description: fillTemplate(messages.pages.city.description, {
      name: city.name,
      department: city.department,
    }),
    alternates: { canonical: cityPagePath(city.slug) },
  };
}

export default async function CityPage({ params }: CityPageProps) {
  const { slug } = await params;
  const city = findCityBySlug(slug);
  if (!city) {
    notFound();
  }

  const messages = await requestMessages();
  const copy = messages.pages.city;

  return (
    <SearchResults
      title={fillTemplate(copy.title, { name: city.name })}
      description={fillTemplate(copy.description, {
        name: city.name,
        department: city.department,
      })}
      messages={messages}
      communeName={city.name}
    />
  );
}
