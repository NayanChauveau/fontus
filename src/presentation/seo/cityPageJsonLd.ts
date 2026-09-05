import { CITY_HUB_PATH, cityPagePath } from "@/presentation/editorial/paths";
import { SITE_NAME, SITE_ORIGIN } from "@/presentation/site";

export function cityPageJsonLd(input: {
  name: string;
  title: string;
  description: string;
  slug: string;
  department: string;
  inLanguage: string;
  homeLabel: string;
  hubLabel: string;
}) {
  const path = cityPagePath(input.slug);
  const url = `${SITE_ORIGIN}${path}`;
  return [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: input.title,
      description: input.description,
      url,
      inLanguage: input.inLanguage,
      isPartOf: {
        "@type": "WebSite",
        name: SITE_NAME,
        url: SITE_ORIGIN,
      },
      about: {
        "@type": "Place",
        name: input.name,
        containedInPlace: {
          "@type": "AdministrativeArea",
          name: input.department,
        },
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: input.homeLabel,
          item: SITE_ORIGIN,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: input.hubLabel,
          item: `${SITE_ORIGIN}${CITY_HUB_PATH}`,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: input.name,
          item: url,
        },
      ],
    },
  ];
}

export function cityHubJsonLd(input: {
  title: string;
  description: string;
  inLanguage: string;
  homeLabel: string;
  hubLabel: string;
}) {
  const url = `${SITE_ORIGIN}${CITY_HUB_PATH}`;
  return [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: input.title,
      description: input.description,
      url,
      inLanguage: input.inLanguage,
      isPartOf: {
        "@type": "WebSite",
        name: SITE_NAME,
        url: SITE_ORIGIN,
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: input.homeLabel,
          item: SITE_ORIGIN,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: input.hubLabel,
          item: url,
        },
      ],
    },
  ];
}
