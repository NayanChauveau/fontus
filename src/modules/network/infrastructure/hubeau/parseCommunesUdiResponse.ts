import type { RawUdiLink } from "../../domain/DistributionNetwork";

export function parseCommunesUdiResponse(payload: unknown): {
  links: RawUdiLink[];
  next: string | null;
} {
  if (!payload || typeof payload !== "object") {
    return { links: [], next: null };
  }

  const record = payload as { data?: unknown; next?: unknown };
  const rows = Array.isArray(record.data) ? record.data : [];
  const next = typeof record.next === "string" ? record.next : null;

  const links: RawUdiLink[] = [];
  for (const row of rows) {
    const link = toLink(row);
    if (link) {
      links.push(link);
    }
  }

  return { links, next };
}

function toLink(row: unknown): RawUdiLink | null {
  if (!row || typeof row !== "object") {
    return null;
  }

  const record = row as Record<string, unknown>;
  const citycode = asNonEmptyString(record.code_commune);
  const city = asNonEmptyString(record.nom_commune);
  const networkCode = asNonEmptyString(record.code_reseau);
  const networkName = asNonEmptyString(record.nom_reseau);
  const year = toYear(record.annee);

  if (!citycode || !city || !networkCode || !networkName || year === null) {
    return null;
  }

  return {
    citycode,
    city,
    networkCode,
    networkName,
    neighborhood:
      typeof record.nom_quartier === "string" ? record.nom_quartier : null,
    year,
    supplyStartedOn:
      typeof record.debut_alim === "string" ? record.debut_alim : null,
  };
}

function asNonEmptyString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function toYear(value: unknown): number | null {
  if (typeof value === "number" && Number.isInteger(value)) {
    return value;
  }
  if (typeof value === "string" && /^\d{4}$/.test(value)) {
    return Number(value);
  }
  return null;
}
