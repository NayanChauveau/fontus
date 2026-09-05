import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { findCityBySlug } from "@/application/cities/largestCities";
import { isNetworkCode, normalizeNetworkCode } from "@/application/networkCode";
import { cityPageCopy } from "@/presentation/cities/cityPageCopy";
import { cityPagePath } from "@/presentation/editorial/paths";
import { intlLocale } from "@/presentation/i18n/messages";
import { requestLocale, requestMessages } from "@/presentation/i18n/requestLocale";
import { cityPageJsonLd } from "@/presentation/seo/cityPageJsonLd";
import { pageSocialMetadata } from "@/presentation/seo/pageSocialMetadata";

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
  const locale = await requestLocale();
  const messages = await requestMessages();
  const copy = cityPageCopy(messages, resolved.city);
  return {
    title: copy.title,
    description: copy.description,
    alternates: { canonical: cityPagePath(resolved.city.slug) },
    ...pageSocialMetadata({
      title: copy.title,
      description: copy.description,
      path: copy.path,
      locale,
    }),
  };
}

export default async function CityUdiPage({ params }: UdiPageProps) {
  const { slug, udi } = await params;
  const resolved = resolveUdiPage(slug, udi);
  if (!resolved) {
    notFound();
  }

  const locale = await requestLocale();
  const messages = await requestMessages();
  const copy = cityPageCopy(messages, resolved.city);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            cityPageJsonLd({
              name: resolved.city.name,
              title: copy.title,
              description: copy.description,
              slug: resolved.city.slug,
              department: resolved.city.department,
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
