import type { ThresholdVersion } from "./ThresholdVersion";

const NPDWR_CITATION =
  "National Primary Drinking Water Regulations, 40 CFR part 141";
const NPDWR_URL =
  "https://www.epa.gov/ground-water-and-drinking-water/national-primary-drinking-water-regulations";
const PFAS_CITATION =
  "PFAS National Primary Drinking Water Regulation, 89 FR 32532 (26 avril 2024)";
const PFAS_URL =
  "https://www.epa.gov/sdwa/and-polyfluoroalkyl-substances-pfas";
const LCR_CITATION =
  "Lead and Copper Rule, 40 CFR 141.80 : action level, pas un MCL";
const NITRATE_CITATION =
  "National Primary Drinking Water Regulations, 40 CFR 141 : MCL 10 mg/L as N, exprimé ici en NO3 (× 4,43)";
const NITRITE_CITATION =
  "National Primary Drinking Water Regulations, 40 CFR 141 : MCL 1 mg/L as N, exprimé ici en NO2 (× 3,28)";

const US_FROM = utc("1992-07-30");
const ARSENIC_FROM = utc("2006-01-23");
const PFAS_FROM = utc("2024-06-25");
const RTCR_FROM = utc("2013-04-01");

function utc(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00.000Z`);
}

function us(
  parameterId: string,
  unit: string,
  value: number,
  options: {
    kind?: ThresholdVersion["kind"];
    binding?: boolean;
    validFrom?: Date;
    suffix?: string;
    citation?: string;
    sourceUrl?: string;
  } = {},
): ThresholdVersion {
  const kind = options.kind ?? "legal_limit";
  return {
    id: `${parameterId}:us${options.suffix ?? ""}`,
    parameterId,
    jurisdiction: "us",
    unit,
    value,
    valueMax: null,
    operator: "lte",
    kind,
    binding: options.binding ?? kind === "legal_limit",
    validFrom: options.validFrom ?? US_FROM,
    validTo: null,
    citation: options.citation ?? NPDWR_CITATION,
    sourceUrl: options.sourceUrl ?? NPDWR_URL,
  };
}

/**
 * Seuils EPA I6. MCLG 0 (PFOA/PFOS) non seedé : reco, pas une interdiction.
 * PFHxS / PFNA : MCL 2024 encore en vigueur (rescision proposée, non finalisée).
 * Pas de PFAS-20 ni de MCL nickel.
 */
export const US_THRESHOLDS: ThresholdVersion[] = [
  us("pfoa", "µg/L", 0.004, {
    validFrom: PFAS_FROM,
    citation: PFAS_CITATION,
    sourceUrl: PFAS_URL,
  }),
  us("pfos", "µg/L", 0.004, {
    validFrom: PFAS_FROM,
    citation: PFAS_CITATION,
    sourceUrl: PFAS_URL,
  }),
  us("pfhxs", "µg/L", 0.01, {
    validFrom: PFAS_FROM,
    citation: PFAS_CITATION,
    sourceUrl: PFAS_URL,
  }),
  us("pfna", "µg/L", 0.01, {
    validFrom: PFAS_FROM,
    citation: PFAS_CITATION,
    sourceUrl: PFAS_URL,
  }),
  us("nitrates", "mg/L", 44.3, { citation: NITRATE_CITATION }),
  us("nitrites", "mg/L", 3.28, { citation: NITRITE_CITATION }),
  us("lead", "µg/L", 15, {
    kind: "quality_reference",
    binding: false,
    citation: LCR_CITATION,
  }),
  us("arsenic", "µg/L", 10, { validFrom: ARSENIC_FROM }),
  us("cadmium", "µg/L", 5),
  us("chromium", "µg/L", 100),
  us("copper", "mg/L", 1.3, {
    kind: "quality_reference",
    binding: false,
    citation: LCR_CITATION,
  }),
  us("mercury", "µg/L", 2),
  us("ecoli", "n/(100mL)", 0, { validFrom: RTCR_FROM }),
  us("atrazine", "µg/L", 3),
];
