import type { ThresholdVersion } from "./ThresholdVersion";

const WHO_CITATION =
  "OMS, Guidelines for drinking-water quality, 4e éd. incorporant les 1er, 2e et 3e addenda";
// 4th edition incorporating the 1st, 2nd and 3rd addenda (June 2026), which supersedes the 2022 edition.
const WHO_URL = "https://www.who.int/publications/i/item/9789240121225";
const WHO_FROM = utc("2011-07-01");
// Dated to the year of the edition that introduced the value (exact day not tracked).
const WHO_1ST_ADDENDUM = utc("2017-01-01"); // barium 1.3 mg/L (was 0.7 mg/L)
const WHO_2ND_ADDENDUM = utc("2022-01-01"); // manganese 80 µg/L (no guideline value before)

function utc(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00.000Z`);
}

function who(
  parameterId: string,
  unit: string,
  value: number,
  options: {
    citation?: string;
    validFrom?: Date;
    validTo?: Date | null;
    suffix?: string;
  } = {},
): ThresholdVersion {
  return {
    id: `${parameterId}:who${options.suffix ?? ""}`,
    parameterId,
    jurisdiction: "who",
    unit,
    value,
    valueMax: null,
    operator: "lte",
    kind: "quality_reference",
    binding: false,
    validFrom: options.validFrom ?? WHO_FROM,
    validTo: options.validTo ?? null,
    citation: options.citation ?? WHO_CITATION,
    sourceUrl: WHO_URL,
  };
}

/**
 * Valeurs guides OMS (GDWQ). Pas des limites légales.
 * Pas de PFAS : le projet de GV PFOA/PFOS n’est pas adopté.
 */
export const WHO_THRESHOLDS: ThresholdVersion[] = [
  who("nitrates", "mg/L", 50, {
    citation: `${WHO_CITATION} : nitrate (as NO3−)`,
  }),
  who("nitrites", "mg/L", 3, {
    citation: `${WHO_CITATION} : nitrite (as NO2−)`,
  }),
  who("lead", "µg/L", 10, {
    citation: `${WHO_CITATION} : plomb, valeur provisoire`,
  }),
  who("arsenic", "µg/L", 10, {
    citation: `${WHO_CITATION} : arsenic, valeur provisoire`,
  }),
  who("cadmium", "µg/L", 3),
  who("chromium", "µg/L", 50, {
    citation: `${WHO_CITATION} : chrome total`,
  }),
  who("nickel", "µg/L", 70),
  who("copper", "mg/L", 2),
  who("mercury", "µg/L", 6, {
    citation: `${WHO_CITATION} : mercure inorganique`,
  }),
  who("atrazine", "µg/L", 100, {
    citation: `${WHO_CITATION} : atrazine et chloro-s-triazines, 0,1 mg/L`,
  }),
  who("ecoli", "n/(100mL)", 0, {
    citation: `${WHO_CITATION} : E. coli indétectable dans 100 mL`,
  }),
  who("fluoride", "mg/L", 1.5),
  who("boron", "mg/L", 2.4),
  who("selenium", "µg/L", 40, {
    citation: `${WHO_CITATION} : sélénium, valeur provisoire`,
  }),
  who("antimony", "µg/L", 20),
  who("uranium", "µg/L", 30, {
    citation: `${WHO_CITATION} : uranium chimique, valeur provisoire`,
  }),
  who("manganese", "µg/L", 80, {
    citation: `${WHO_CITATION} : manganèse total, valeur provisoire (introduite avec le 2e addendum, 2022)`,
    validFrom: WHO_2ND_ADDENDUM,
  }),
  who("barium", "mg/L", 0.7, {
    validTo: WHO_1ST_ADDENDUM,
    suffix: ":0.7",
    citation: "OMS, Guidelines for drinking-water quality, 4e éd. (2011) : baryum 0,7 mg/L",
  }),
  who("barium", "mg/L", 1.3, {
    validFrom: WHO_1ST_ADDENDUM,
    citation: `${WHO_CITATION} : baryum, 1,3 mg/L depuis le 1er addendum (2017)`,
  }),
];
