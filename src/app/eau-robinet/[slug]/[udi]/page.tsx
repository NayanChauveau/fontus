import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { findCityBySlug } from "@/application/cities/largestCities";
import { isNetworkCode, normalizeNetworkCode } from "@/application/networkCode";
import { SearchResults } from "@/components/SearchResults";
import { cityUdiPath } from "@/presentation/editorial/paths";
import { fillTemplate } from "@/presentation/i18n/fillTemplate";
import { requestMessages } from "@/presentation/i18n/requestLocale";

type UdiPageProps = {
  params: Promise<{ slug: string; udi: string }>;
};

function resolveUdiPage(slug: string, udi: string) {
  const city = findCityBySlug(slug);
  if (!city) {
    return null;
  }
  const networkCode = normalizeNetworkCode(udi);
  if (!isNetworkCode(networkCode)) {
    return null;
  }
  return { city, networkCode };
}

export async function generateMetadata({
  params,
}: UdiPageProps): Promise<Metadata> {
  const { slug, udi } = await params;
  const resolved = resolveUdiPage(slug, udi);
  if (!resolved) {
    return {};
  }
  const messages = await requestMessages();
  return {
    title: fillTemplate(messages.pages.city.title, {
      name: resolved.city.name,
    }),
    description: fillTemplate(messages.pages.city.description, {
      name: resolved.city.name,
      department: resolved.city.department,
    }),
    alternates: {
      canonical: cityUdiPath(resolved.city.slug, resolved.networkCode),
    },
  };
}

export default async function CityUdiPage({ params }: UdiPageProps) {
  const { slug, udi } = await params;
  const resolved = resolveUdiPage(slug, udi);
  if (!resolved) {
    notFound();
  }

  const messages = await requestMessages();
  const copy = messages.pages.city;

  return (
    <SearchResults
      title={fillTemplate(copy.title, { name: resolved.city.name })}
      description={fillTemplate(copy.description, {
        name: resolved.city.name,
        department: resolved.city.department,
      })}
      messages={messages}
      communeName={resolved.city.name}
    />
  );
}
