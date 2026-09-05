import { SITE_NAME, SITE_ORIGIN } from "@/presentation/site";

export function siteJsonLd(input: {
  description: string;
  inLanguage: string;
}) {
  return [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: SITE_NAME,
      url: SITE_ORIGIN,
      description: input.description,
      inLanguage: input.inLanguage,
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_ORIGIN,
    },
  ];
}
