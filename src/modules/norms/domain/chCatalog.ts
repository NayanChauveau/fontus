import type { ThresholdVersion } from "./ThresholdVersion";

const CH_CITATION =
  "Ordonnance du DFI sur l’eau potable et l’eau des installations de baignade et de douche accessibles au public (OPBD), RS 817.022.11, annexe 2";
const CH_URL = "https://www.fedlex.admin.ch/eli/cc/2017/163/fr";
const CH_PFAS_URL = "https://www.blv.admin.ch/fr/pfas-fr";
const CH_2026_CITATION =
  "OPBD, RS 817.022.11, annexe 2, telle que modifiée par le RO 2026 369 (en vigueur le 1er août 2026)";
const CH_2026_URL = "https://www.fedlex.admin.ch/eli/oc/2026/369/fr";

const CH_FROM = utc("2017-05-01");
const CH_LEAD_CR_TIGHTEN = utc("2026-08-01");

function utc(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00.000Z`);
}

function ch(
  parameterId: string,
  unit: string,
  value: number,
  options: {
    operator?: ThresholdVersion["operator"];
    valueMax?: number | null;
    kind?: ThresholdVersion["kind"];
    binding?: boolean;
    validFrom?: Date;
    validTo?: Date | null;
    suffix?: string;
    citation?: string;
    sourceUrl?: string;
  } = {},
): ThresholdVersion {
  const kind = options.kind ?? "legal_limit";
  return {
    id: `${parameterId}:ch${options.suffix ?? ""}`,
    parameterId,
    jurisdiction: "ch",
    unit,
    value,
    valueMax: options.valueMax ?? null,
    operator: options.operator ?? "lte",
    kind,
    binding: options.binding ?? kind === "legal_limit",
    validFrom: options.validFrom ?? CH_FROM,
    validTo: options.validTo ?? null,
    citation: options.citation ?? CH_CITATION,
    sourceUrl: options.sourceUrl ?? CH_URL,
  };
}

/** Seuils suisses I6. Pas de PFAS-20 : consultation OSAV, pas encore en vigueur. */
export const CH_THRESHOLDS: ThresholdVersion[] = [
  ch("pfoa", "µg/L", 0.5, { sourceUrl: CH_PFAS_URL }),
  ch("pfos", "µg/L", 0.3, { sourceUrl: CH_PFAS_URL }),
  ch("pfhxs", "µg/L", 0.3, { sourceUrl: CH_PFAS_URL }),
  ch("nitrates", "mg/L", 40),
  ch("nitrites", "mg/L", 0.1),
  ch("lead", "µg/L", 10, { validTo: CH_LEAD_CR_TIGHTEN, suffix: ":10" }),
  ch("lead", "µg/L", 5, {
    validFrom: CH_LEAD_CR_TIGHTEN,
    suffix: ":5",
    citation: CH_2026_CITATION,
    sourceUrl: CH_2026_URL,
  }),
  ch("arsenic", "µg/L", 10),
  ch("cadmium", "µg/L", 3),
  ch("chromium", "µg/L", 50, { validTo: CH_LEAD_CR_TIGHTEN, suffix: ":50" }),
  ch("chromium", "µg/L", 20, {
    validFrom: CH_LEAD_CR_TIGHTEN,
    suffix: ":20",
    citation: CH_2026_CITATION,
    sourceUrl: CH_2026_URL,
  }),
  ch("nickel", "µg/L", 20),
  ch("copper", "mg/L", 1),
  ch("mercury", "µg/L", 1),
  ch("ecoli", "n/(100mL)", 0),
  ch("enterococci", "n/(100mL)", 0),
  ch("atrazine", "µg/L", 0.1),
  ch("pesticides_total", "µg/L", 0.5),
  ch("aluminium", "µg/L", 200),
  ch("iron", "µg/L", 200),
  ch("fluoride", "mg/L", 1.5),
  ch("boron", "mg/L", 1),
  ch("selenium", "µg/L", 10),
  ch("antimony", "µg/L", 5),
  ch("manganese", "µg/L", 50),
  ch("uranium", "µg/L", 30),
  ch("sodium", "mg/L", 200),
];
