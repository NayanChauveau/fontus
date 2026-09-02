import type { AnalysisSample } from "./Analysis";
import { parseAlphanumericResult } from "./parseAlphanumericResult";

export type DisExportInput = {
  udiCom?: string;
  plv: string;
  result: string;
  networkCode: string;
  dateMin?: string;
};

const UDI_ALIASES = ["cdreseau", "code_reseau"];
const COMMUNE_ALIASES = [
  "inseecommuneprinc",
  "inseecommune",
  "code_commune",
];
const REF_ALIASES = ["referenceprel", "code_prelevement"];
const DATE_ALIASES = ["dateprel", "date_prelevement"];
const TIME_ALIASES = ["heureprel", "heure_prelevement"];
const CONCLUSION_ALIASES = [
  "conclusionprel",
  "conclusion_conformite_prelevement",
];
const BACT_ALIASES = [
  "plvconformitebacterio",
  "conformite_limites_bact_prelevement",
];
const PC_ALIASES = [
  "plvconformitechimique",
  "conformite_limites_pc_prelevement",
];
const PARAM_ALIASES = ["cdparametre", "code_parametre"];
const LABEL_ALIASES = [
  "libmajparametre",
  "libelle_parametre",
  "lbparametre",
];
const SISE_ALIASES = ["cdparametreanl", "code_parametre_se"];
const CAS_ALIASES = ["cdcasparam", "code_parametre_cas"];
const RAW_ALIASES = ["rqana", "resultat_alphanumerique"];
const NUMERIC_ALIASES = ["rsana", "resultat_numerique"];
const UNIT_ALIASES = ["lbunite", "libelle_unite"];

export function parseDisExport(input: DisExportInput): AnalysisSample[] {
  const networkCode = padNetwork(input.networkCode);
  const communes = communesForNetwork(input.udiCom ?? "", networkCode);
  const plvRows = parseTable(input.plv);
  const resultRows = parseTable(input.result);
  const samples = new Map<string, AnalysisSample>();

  for (const row of plvRows) {
    const sample = toSample(row, networkCode, input.dateMin, communes[0] ?? null);
    if (sample) {
      samples.set(sample.code, sample);
    }
  }

  for (const row of resultRows) {
    const ref = cell(row, REF_ALIASES);
    const sample = ref ? samples.get(ref) : undefined;
    const measurement = toMeasurement(row);
    if (!sample || !measurement) {
      continue;
    }
    if (
      !sample.measurements.some(
        (item) => item.parameterCode === measurement.parameterCode,
      )
    ) {
      sample.measurements.push(measurement);
    }
  }

  return [...samples.values()].filter((sample) => sample.measurements.length > 0);
}

function communesForNetwork(udiCom: string, networkCode: string): string[] {
  const communes: string[] = [];
  for (const row of parseTable(udiCom)) {
    if (padNetwork(cell(row, UDI_ALIASES) ?? "") !== networkCode) {
      continue;
    }
    const commune = cell(row, COMMUNE_ALIASES);
    if (commune) {
      communes.push(commune);
    }
  }
  return communes;
}

function toSample(
  row: DisRow,
  networkCode: string,
  dateMin: string | undefined,
  fallbackCommune: string | null,
): AnalysisSample | null {
  if (padNetwork(cell(row, UDI_ALIASES) ?? "") !== networkCode) {
    return null;
  }
  const code = cell(row, REF_ALIASES);
  const sampledAt = parseDisDate(cell(row, DATE_ALIASES), cell(row, TIME_ALIASES));
  if (!code || !sampledAt) {
    return null;
  }
  if (dateMin && sampledAt.toISOString().slice(0, 10) < dateMin) {
    return null;
  }

  return {
    code,
    udiCode: networkCode,
    sampledAt,
    conclusion: cell(row, CONCLUSION_ALIASES),
    conformiteLimitesBact: cell(row, BACT_ALIASES),
    conformiteLimitesPc: cell(row, PC_ALIASES),
    communeInsee: cell(row, COMMUNE_ALIASES) ?? fallbackCommune,
    source: "dis",
    measurements: [],
  };
}

function toMeasurement(row: DisRow): AnalysisSample["measurements"][number] | null {
  const parameterCode = cell(row, PARAM_ALIASES);
  const parameterLabel = cell(row, LABEL_ALIASES);
  if (!parameterCode || !parameterLabel) {
    return null;
  }

  const raw = cell(row, RAW_ALIASES);
  const numericText = cell(row, NUMERIC_ALIASES);
  const numeric = numericText ? parseFrenchNumericCell(numericText) : null;
  const parsed = parseAlphanumericResult(raw, numeric);

  return {
    parameterCode,
    parameterLabel,
    siseCode: cell(row, SISE_ALIASES),
    casCode: cell(row, CAS_ALIASES),
    rawText: parsed.rawText || raw || numericText || "",
    numericValue: parsed.numericValue,
    qualifier: parsed.qualifier,
    unit: cell(row, UNIT_ALIASES),
  };
}

type DisRow = Map<string, string>;

function createDisTableReader() {
  let delimiter: string | null = null;
  let names: string[] = [];

  return {
    push(line: string): DisRow | null {
      const trimmed = line.trim();
      if (trimmed.length === 0) {
        return null;
      }
      if (delimiter === null) {
        delimiter = trimmed.includes(";") && !trimmed.includes(",") ? ";" : ",";
        names = splitCsv(trimmed, delimiter).map(normalizeHeader);
        return null;
      }
      const values = splitCsv(trimmed, delimiter);
      if (values.every((value) => value.length === 0)) {
        return null;
      }
      const row = new Map<string, string>();
      names.forEach((name, index) => {
        row.set(name, values[index] ?? "");
      });
      return row;
    },
  };
}

function parseTable(text: string): DisRow[] {
  const reader = createDisTableReader();
  return text
    .split(/\r?\n/)
    .flatMap((line) => {
      const row = reader.push(line);
      return row ? [row] : [];
    });
}

function cell(row: DisRow, aliases: readonly string[]): string | null {
  for (const alias of aliases) {
    const value = row.get(alias)?.trim();
    if (value) {
      return value;
    }
  }
  return null;
}

function splitCsv(line: string, delimiter: string): string[] {
  const cells: string[] = [];
  let current = "";
  let quoted = false;
  for (const char of line) {
    if (char === '"') {
      quoted = !quoted;
      continue;
    }
    if (char === delimiter && !quoted) {
      cells.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  cells.push(current);
  return cells;
}

function normalizeHeader(name: string): string {
  return name.trim().toLowerCase().replace(/^\ufeff/, "");
}

function padNetwork(code: string): string {
  return code.trim().padStart(9, "0");
}

function parseFrenchNumericCell(value: string): number | null {
  const normalized = value.trim().replace(/\s/g, "").replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

export function parseDisDate(
  date: string | null,
  time: string | null,
): Date | null {
  if (!date) {
    return null;
  }
  const isoDate = toIsoDate(date);
  if (!isoDate) {
    return null;
  }
  const isoTime = toIsoTime(time);
  const parsed = new Date(`${isoDate}T${isoTime}.000Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function toIsoDate(value: string): string | null {
  const trimmed = value.trim();
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(trimmed);
  if (iso) {
    return `${iso[1]}-${iso[2]}-${iso[3]}`;
  }
  const fr = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(trimmed);
  if (fr) {
    return `${fr[3]}-${fr[2]}-${fr[1]}`;
  }
  const compact = /^(\d{4})(\d{2})(\d{2})$/.exec(trimmed);
  if (compact) {
    return `${compact[1]}-${compact[2]}-${compact[3]}`;
  }
  return null;
}

function toIsoTime(value: string | null): string {
  if (!value) {
    return "00:00:00";
  }
  const trimmed = value.trim();
  const colon = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(trimmed);
  if (colon) {
    return `${colon[1]!.padStart(2, "0")}:${colon[2]}:${colon[3] ?? "00"}`;
  }
  const compact = /^(\d{2})(\d{2})(\d{2})?$/.exec(trimmed);
  if (compact) {
    return `${compact[1]}:${compact[2]}:${compact[3] ?? "00"}`;
  }
  return "00:00:00";
}
