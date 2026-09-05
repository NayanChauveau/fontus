import type { MetadataRoute } from "next";
import { SITE_ORIGIN } from "@/presentation/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_ORIGIN,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_ORIGIN}/mentions-legales`,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${SITE_ORIGIN}/confidentialite`,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
