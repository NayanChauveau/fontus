import { findCityByInsee } from "@/application/cities/largestCities";

export function formatCityName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) {
    return "";
  }
  const chars = [...trimmed.toLocaleLowerCase("fr-FR")];
  chars[0] = chars[0]!.toLocaleUpperCase("fr-FR");
  return chars.join("");
}

export function displayCityName(
  citycode: string,
  fallback?: string | null,
): string {
  return findCityByInsee(citycode)?.name ?? formatCityName(fallback ?? "");
}
