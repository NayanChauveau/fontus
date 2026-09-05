import type { LargestCity } from "@/application/cities/largestCities";
import { cityPagePath } from "@/presentation/editorial/paths";
import { fillTemplate } from "@/presentation/i18n/fillTemplate";
import type { Messages } from "@/presentation/i18n/messages";

export function cityPageCopy(messages: Messages, city: LargestCity) {
  return {
    title: fillTemplate(messages.pages.city.title, { name: city.name }),
    description: fillTemplate(messages.pages.city.description, {
      name: city.name,
      department: city.department,
      insee: city.insee,
    }),
    path: cityPagePath(city.slug),
  };
}
