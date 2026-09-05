import type { Metadata } from "next";
import type { Locale } from "@/presentation/i18n/messages";
import { SITE_NAME } from "@/presentation/site";

export function pageSocialMetadata(input: {
  title: string;
  description: string;
  path: string;
  locale: Locale;
}): Pick<Metadata, "openGraph" | "twitter"> {
  return {
    openGraph: {
      type: "website",
      locale: input.locale === "en" ? "en_GB" : "fr_FR",
      url: input.path,
      siteName: SITE_NAME,
      title: input.title,
      description: input.description,
    },
    twitter: {
      card: "summary",
      title: input.title,
      description: input.description,
    },
  };
}
