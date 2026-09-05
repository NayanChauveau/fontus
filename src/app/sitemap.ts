import type { MetadataRoute } from "next";
import { LARGEST_CITIES } from "@/application/cities/largestCities";
import {
  CITY_HUB_PATH,
  cityPagePath,
  EDITORIAL_PATHS,
} from "@/presentation/editorial/paths";
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
    ...EDITORIAL_PATHS.map((path) => ({
      url: `${SITE_ORIGIN}${path}`,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    {
      url: `${SITE_ORIGIN}${CITY_HUB_PATH}`,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...LARGEST_CITIES.map((city) => ({
      url: `${SITE_ORIGIN}${cityPagePath(city.slug)}`,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
