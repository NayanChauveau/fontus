import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { findCityBySlug, LARGEST_CITIES } from "@/application/cities/largestCities";
import { cityPageCopy } from "@/presentation/cities/cityPageCopy";
import { intlLocale } from "@/presentation/i18n/messages";
import { requestLocale, requestMessages } from "@/presentation/i18n/requestLocale";
import { cityPageJsonLd } from "@/presentation/seo/cityPageJsonLd";
import { pageSocialMetadata } from "@/presentation/seo/pageSocialMetadata";

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
  const locale = await requestLocale();
  const messages = await requestMessages();
  const copy = cityPageCopy(messages, city);
  return {
    title: copy.title,
    description: copy.description,
    alternates: { canonical: copy.path },
    ...pageSocialMetadata({
      title: copy.title,
      description: copy.description,
      path: copy.path,
      locale,
    }),
  };
}

export default async function CityPage({ params }: CityPageProps) {
  const { slug } = await params;
  const city = findCityBySlug(slug);
  if (!city) {
    notFound();
  }

  const locale = await requestLocale();
  const messages = await requestMessages();
  const copy = cityPageCopy(messages, city);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            cityPageJsonLd({
              name: city.name,
              title: copy.title,
              description: copy.description,
              slug: city.slug,
              department: city.department,
              inLanguage: intlLocale(locale),
              homeLabel: messages.nav.home,
              hubLabel: messages.pages.city.hubCrumb,
            }),
          ),
        }}
      />
    </>
  );
}
