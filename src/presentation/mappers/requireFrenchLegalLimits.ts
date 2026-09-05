import { intlLocale, type Locale } from "@/presentation/i18n/messages";
import { presentFrenchLegalLimits } from "./presentLegalLimit";

export function requireFrenchLegalLimits(parameterId: string, locale: Locale) {
  const limits = presentFrenchLegalLimits(
    parameterId,
    new Date(),
    intlLocale(locale),
  );
  if (!limits) {
    throw new Error(`Missing FR legal_limit for ${parameterId}`);
  }
  return limits;
}
