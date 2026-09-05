import { FR_EU_THRESHOLDS } from "@/modules/norms/domain/frEuCatalog";
import {
  findActiveThreshold,
  type ThresholdVersion,
} from "@/modules/norms/domain/ThresholdVersion";

export type PresentedLegalLimit = {
  parameterId: string;
  valueLabel: string;
  citation: string;
  sourceUrl: string;
  validFrom: Date;
  validTo: Date | null;
};

export type PresentedLegalLimits = {
  current: PresentedLegalLimit;
  upcoming: PresentedLegalLimit | null;
};

export function presentFrenchLegalLimits(
  parameterId: string,
  at: Date,
  locale: string,
): PresentedLegalLimits | null {
  const frenchLegal = FR_EU_THRESHOLDS.filter(
    (version) =>
      version.parameterId === parameterId &&
      version.jurisdiction === "fr" &&
      version.kind === "legal_limit",
  );
  const current = findActiveThreshold(
    frenchLegal,
    parameterId,
    "fr",
    at,
  );
  if (!current) {
    return null;
  }
  const upcoming =
    frenchLegal
      .filter((version) => version.validFrom.getTime() > at.getTime())
      .sort((left, right) => left.validFrom.getTime() - right.validFrom.getTime())[0] ??
    null;
  return {
    current: present(current, locale),
    upcoming: upcoming ? present(upcoming, locale) : null,
  };
}

function present(version: ThresholdVersion, locale: string): PresentedLegalLimit {
  return {
    parameterId: version.parameterId,
    valueLabel: `${formatLimitValue(version.value, locale)} ${version.unit}`,
    citation: version.citation,
    sourceUrl: version.sourceUrl,
    validFrom: version.validFrom,
    validTo: version.validTo,
  };
}

function formatLimitValue(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 6 }).format(value);
}

export function formatLimitDate(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(date);
}
