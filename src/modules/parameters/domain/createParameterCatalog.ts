import type { CanonicalParameter } from "./Parameter";
import { UNLISTED_PRIORITY, unlistedParameterId } from "./Parameter";
import { normalizeUnit } from "./normalizeUnit";

export type SeenParameterCode = {
  code: string;
  label: string;
  unit: string | null;
};

export type ParameterCatalog = {
  findByExternalCode(code: string): CanonicalParameter | null;
  add(parameter: CanonicalParameter): void;
  list(): CanonicalParameter[];
};

export function createParameterCatalog(
  seed: CanonicalParameter[],
): ParameterCatalog {
  const byId = new Map<string, CanonicalParameter>();
  const byCode = new Map<string, CanonicalParameter>();

  for (const parameter of seed) {
    index(parameter);
  }

  function index(parameter: CanonicalParameter) {
    byId.set(parameter.id, parameter);
    for (const alias of parameter.aliases) {
      const existing = byCode.get(alias.externalCode);
      if (existing && existing.origin === "seed" && parameter.origin === "import") {
        continue;
      }
      byCode.set(alias.externalCode, parameter);
    }
  }

  return {
    findByExternalCode(code) {
      return byCode.get(code) ?? null;
    },
    add(parameter) {
      index(parameter);
    },
    list() {
      return [...byId.values()];
    },
  };
}

export function createUnlistedParameter(
  seen: SeenParameterCode,
): CanonicalParameter {
  return {
    id: unlistedParameterId(seen.code),
    name: seen.label,
    cas: null,
    category: "unlisted",
    canonicalUnit: normalizeUnit(seen.unit),
    displayPriority: UNLISTED_PRIORITY,
    origin: "import",
    aliases: [
      { source: "sandre", externalCode: seen.code, label: seen.label },
    ],
  };
}
