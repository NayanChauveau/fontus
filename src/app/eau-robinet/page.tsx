import type { Metadata } from "next";
import Link from "next/link";
import { LARGEST_CITIES } from "@/application/cities/largestCities";
import { EditorialPage } from "@/components/EditorialPage";
import { HomeCta } from "@/components/HomeCta";
import { CITY_HUB_PATH, cityPagePath } from "@/presentation/editorial/paths";
import { intlLocale } from "@/presentation/i18n/messages";
import { requestLocale, requestMessages } from "@/presentation/i18n/requestLocale";
import { cityHubJsonLd } from "@/presentation/seo/cityPageJsonLd";
import { pageSocialMetadata } from "@/presentation/seo/pageSocialMetadata";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await requestLocale();
  const messages = await requestMessages();
  const copy = messages.pages.city;
  return {
    title: copy.hubTitle,
    description: copy.hubDescription,
    alternates: { canonical: CITY_HUB_PATH },
    ...pageSocialMetadata({
      title: copy.hubTitle,
      description: copy.hubDescription,
      path: CITY_HUB_PATH,
      locale,
    }),
  };
}

export default async function CityHubPage() {
  const locale = await requestLocale();
  const messages = await requestMessages();
  const copy = messages.pages.city;
  return (
    <EditorialPage messages={messages} title={copy.hubTitle} crumb={copy.hubCrumb}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            cityHubJsonLd({
              title: copy.hubTitle,
              description: copy.hubDescription,
              inLanguage: intlLocale(locale),
              homeLabel: messages.nav.home,
              hubLabel: copy.hubCrumb,
            }),
          ),
        }}
      />
      <p>{copy.hubIntro}</p>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        {LARGEST_CITIES.map((city) => (
          <li key={city.slug}>
            <Link
              href={cityPagePath(city.slug)}
              className="font-medium underline-offset-2 hover:underline"
            >
              {city.name}
            </Link>
            <span className="text-zinc-500"> — {city.department}</span>
          </li>
        ))}
      </ul>
      <HomeCta label={messages.pages.cta} />
    </EditorialPage>
  );
}
