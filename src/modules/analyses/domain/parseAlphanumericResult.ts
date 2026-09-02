export type MeasurementQualifier = "eq" | "lt" | "gt";

export type ParsedMeasurement = {
  rawText: string;
  numericValue: number | null;
  qualifier: MeasurementQualifier;
};

export function parseFrenchNumber(value: string): number | null {
  const normalized = value.trim().replace(/\s/g, "").replace(",", ".");
  if (!/^-?\d+(?:\.\d+)?$/.test(normalized)) {
    return null;
  }
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Hub’Eau sends `resultat_alphanumerique: "<0,01"` and `resultat_numerique: 0.0`.
 * `< LQ` is not zero. Qualitative text is not a number even if numeric is 0.
 */
export function parseAlphanumericResult(
  alphanumeric: string | null | undefined,
  numeric: number | null | undefined,
): ParsedMeasurement {
  const rawText = (alphanumeric ?? "").trim();

  if (rawText.length === 0) {
    if (typeof numeric === "number" && Number.isFinite(numeric)) {
      return { rawText: String(numeric), numericValue: numeric, qualifier: "eq" };
    }
    return { rawText: "", numericValue: null, qualifier: "eq" };
  }

  const comparison = /^(<|>)\s*(.+)$/.exec(rawText);
  if (comparison) {
    return {
      rawText,
      numericValue: parseFrenchNumber(comparison[2] ?? ""),
      qualifier: comparison[1] === "<" ? "lt" : "gt",
    };
  }

  const parsed = parseFrenchNumber(rawText);
  if (parsed !== null) {
    return { rawText, numericValue: parsed, qualifier: "eq" };
  }

  return { rawText, numericValue: null, qualifier: "eq" };
}
