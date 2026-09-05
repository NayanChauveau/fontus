import type { Metadata } from "next";
import Link from "next/link";
import { LARGEST_CITIES } from "@/application/cities/largestCities";
import { EditorialPage } from "@/components/EditorialPage";
import { HomeCta } from "@/components/HomeCta";
import { CITY_HUB_PATH, cityPagePath } from "@/presentation/editorial/paths";
import { requestMessages } from "@/presentation/i18n/requestLocale";

export async function generateMetadata(): Promise<Metadata> {
  const messages = await requestMessages();
  return {
    title: messages.pages.city.hubTitle,
    description: messages.pages.city.hubDescription,
    alternates: { canonical: CITY_HUB_PATH },
  };
}

export default async function CityHubPage() {
  const messages = await requestMessages();
  const copy = messages.pages.city;
  return (
    <EditorialPage messages={messages} title={copy.hubTitle} crumb={copy.hubCrumb}>
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
