const MASS_UNITS = new Set(["ng/L", "µg/L", "mg/L", "g/L"]);

export function normalizeUnit(raw: string | null | undefined): string | null {
  if (!raw) {
    return null;
  }

  const trimmed = raw.trim();
  if (trimmed.length === 0 || /^sans\s+objet$/i.test(trimmed)) {
    return null;
  }

  const compact = trimmed
    .replace(/μ/g, "µ")
    .replace(/\s+/g, "")
    .replace(/^ug\//i, "µg/")
    .replace(/^UG\//, "µg/");

  const massWithAnalyte = /^(ng|µg|mg|g)\([^)]+\)\/[lL]$/i.exec(compact);
  if (massWithAnalyte) {
    return `${normalizeMassPrefix(massWithAnalyte[1] ?? "")}/L`;
  }

  const mass = /^(ng|µg|ug|mg|g)\/[lL]$/i.exec(compact);
  if (mass) {
    return `${normalizeMassPrefix(mass[1] ?? "")}/L`;
  }

  return trimmed.replace(/μ/g, "µ");
}

export function isMassConcentrationUnit(unit: string | null): boolean {
  return unit !== null && MASS_UNITS.has(unit);
}

function normalizeMassPrefix(prefix: string): string {
  const lower = prefix.toLowerCase().replace("μ", "µ");
  if (lower === "ug" || lower === "µg") {
    return "µg";
  }
  return lower;
}
