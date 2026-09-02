import type { ThresholdVersion } from "./ThresholdVersion";

const EU_CITATION =
  "Directive (UE) 2020/2184 du 16 décembre 2020, annexe I";
const EU_URL =
  "https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32020L2184";
const FR_CITATION =
  "Arrêté du 30 décembre 2022 relatif aux eaux destinées à la consommation humaine";
const FR_URL = "https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000046879740";

const EU_FROM = utc("1998-12-25");
const FR_FROM = utc("2007-01-11");
const PFAS_FROM = utc("2026-01-12");
const LEAD_10_FROM = utc("2013-12-25");
const TIGHTEN_2036 = utc("2036-01-12");

function utc(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00.000Z`);
}

function pair(
  parameterId: string,
  unit: string,
  value: number,
  options: {
    operator?: ThresholdVersion["operator"];
    valueMax?: number | null;
    kind?: ThresholdVersion["kind"];
    binding?: boolean;
    validFromEu?: Date;
    validFromFr?: Date;
    validTo?: Date | null;
    suffix?: string;
  } = {},
): ThresholdVersion[] {
  const operator = options.operator ?? "lte";
  const valueMax = options.valueMax ?? null;
  const kind = options.kind ?? "legal_limit";
  const binding = options.binding ?? kind === "legal_limit";
  const validTo = options.validTo ?? null;
  const suffix = options.suffix ?? "";

  return [
    {
      id: `${parameterId}:fr${suffix}`,
      parameterId,
      jurisdiction: "fr",
      unit,
      value,
      valueMax,
      operator,
      kind,
      binding,
      validFrom: options.validFromFr ?? FR_FROM,
      validTo,
      citation: FR_CITATION,
      sourceUrl: FR_URL,
    },
    {
      id: `${parameterId}:eu${suffix}`,
      parameterId,
      jurisdiction: "eu",
      unit,
      value,
      valueMax,
      operator,
      kind,
      binding,
      validFrom: options.validFromEu ?? EU_FROM,
      validTo,
      citation: EU_CITATION,
      sourceUrl: EU_URL,
    },
  ];
}

/** Seuils FR / UE I5. Pas de PFAS individuels ni de TH : pas de limite officielle. */
export const FR_EU_THRESHOLDS: ThresholdVersion[] = [
  ...pair("pfas20", "µg/L", 0.1, {
    validFromFr: PFAS_FROM,
    validFromEu: PFAS_FROM,
    suffix: ":2026",
  }),
  ...pair("nitrates", "mg/L", 50),
  ...pair("nitrites", "mg/L", 0.5),
  ...pair("lead", "µg/L", 10, {
    validFromFr: LEAD_10_FROM,
    validFromEu: LEAD_10_FROM,
    validTo: TIGHTEN_2036,
    suffix: ":10",
  }),
  ...pair("lead", "µg/L", 5, {
    validFromFr: TIGHTEN_2036,
    validFromEu: TIGHTEN_2036,
    suffix: ":5",
  }),
  ...pair("arsenic", "µg/L", 10),
  ...pair("cadmium", "µg/L", 5),
  ...pair("chromium", "µg/L", 50, {
    validTo: TIGHTEN_2036,
    suffix: ":50",
  }),
  ...pair("chromium", "µg/L", 25, {
    validFromFr: TIGHTEN_2036,
    validFromEu: TIGHTEN_2036,
    suffix: ":25",
  }),
  ...pair("nickel", "µg/L", 20),
  ...pair("copper", "mg/L", 2),
  ...pair("mercury", "µg/L", 1),
  ...pair("ecoli", "n/(100mL)", 0),
  ...pair("enterococci", "n/(100mL)", 0),
  ...pair("atrazine", "µg/L", 0.1),
  ...pair("pesticides_total", "µg/L", 0.5),
  ...pair("aluminium", "µg/L", 200, {
    kind: "quality_reference",
    binding: false,
  }),
  ...pair("iron", "µg/L", 200, {
    kind: "quality_reference",
    binding: false,
  }),
  {
    id: "ph:fr",
    parameterId: "ph",
    jurisdiction: "fr",
    unit: "unité pH",
    value: 6.5,
    valueMax: 9.0,
    operator: "range",
    kind: "quality_reference",
    binding: false,
    validFrom: FR_FROM,
    validTo: null,
    citation: FR_CITATION,
    sourceUrl: FR_URL,
  },
  {
    id: "ph:eu",
    parameterId: "ph",
    jurisdiction: "eu",
    unit: "unité pH",
    value: 6.5,
    valueMax: 9.5,
    operator: "range",
    kind: "quality_reference",
    binding: false,
    validFrom: EU_FROM,
    validTo: null,
    citation: EU_CITATION,
    sourceUrl: EU_URL,
  },
];
