import type { AnalysisSample } from "../../domain/Analysis";
import { parseAlphanumericResult } from "../../domain/parseAlphanumericResult";

export function parseResultatsDisResponse(
  payload: unknown,
  networkCode: string,
): {
  count: number;
  next: string | null;
  samples: AnalysisSample[];
} {
  if (!payload || typeof payload !== "object") {
    return { count: 0, next: null, samples: [] };
  }

  const record = payload as { count?: unknown; next?: unknown; data?: unknown };
  const count = typeof record.count === "number" ? record.count : 0;
  const next = typeof record.next === "string" ? record.next : null;
  const rows = Array.isArray(record.data) ? record.data : [];

  const bySample = new Map<string, AnalysisSample>();

  for (const row of rows) {
    const parsed = toMeasurementRow(row, networkCode);
    if (!parsed) {
      continue;
    }

    const existing = bySample.get(parsed.sample.code);
    if (!existing) {
      bySample.set(parsed.sample.code, parsed.sample);
      continue;
    }

    if (
      !existing.measurements.some(
        (measurement) => measurement.parameterCode === parsed.measurement.parameterCode,
      )
    ) {
      existing.measurements.push(parsed.measurement);
    }
  }

  return { count, next, samples: [...bySample.values()] };
}

function toMeasurementRow(
  row: unknown,
  networkCode: string,
): {
  sample: AnalysisSample;
  measurement: AnalysisSample["measurements"][number];
} | null {
  if (!row || typeof row !== "object") {
    return null;
  }

  const record = row as Record<string, unknown>;
  const sampleCode = asString(record.code_prelevement);
  const udiCode = networkCode;
  const parameterCode = asString(record.code_parametre);
  const parameterLabel = asString(record.libelle_parametre);
  const sampledAt = toDate(record.date_prelevement);

  if (!sampleCode || !udiCode || !parameterCode || !parameterLabel || !sampledAt) {
    return null;
  }

  const parsed = parseAlphanumericResult(
    asString(record.resultat_alphanumerique),
    typeof record.resultat_numerique === "number" ? record.resultat_numerique : null,
  );

  const measurement = {
    parameterCode,
    parameterLabel,
    rawText: parsed.rawText,
    numericValue: parsed.numericValue,
    qualifier: parsed.qualifier,
    unit: asString(record.libelle_unite),
  };

  return {
    sample: {
      code: sampleCode,
      udiCode,
      sampledAt,
      conclusion: asString(record.conclusion_conformite_prelevement),
      conformiteLimitesBact: asString(record.conformite_limites_bact_prelevement),
      conformiteLimitesPc: asString(record.conformite_limites_pc_prelevement),
      communeInsee: asString(record.code_commune),
      source: "hubeau",
      measurements: [measurement],
    },
    measurement,
  };
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function toDate(value: unknown): Date | null {
  if (typeof value !== "string") {
    return null;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}
