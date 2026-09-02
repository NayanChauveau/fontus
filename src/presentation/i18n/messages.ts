import { en, type Messages } from "./en";
import { fr } from "./fr";

export type { Messages };
export type Locale = "fr" | "en";

export const catalogs: Record<Locale, Messages> = { fr, en };

export function isLocale(value: string | null): value is Locale {
  return value === "fr" || value === "en";
}

export function getMessages(locale: Locale): Messages {
  return catalogs[locale];
}

export function intlLocale(locale: Locale): string {
  return locale === "en" ? "en-GB" : "fr-FR";
}
