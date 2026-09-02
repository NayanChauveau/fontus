export type Jurisdiction = "fr" | "eu" | "ch" | "us";

export type ThresholdKind = "legal_limit" | "quality_reference";

export type ThresholdOperator = "lte" | "gte" | "range";

export type ThresholdVersion = {
  id: string;
  parameterId: string;
  jurisdiction: Jurisdiction;
  unit: string;
  value: number;
  valueMax: number | null;
  operator: ThresholdOperator;
  kind: ThresholdKind;
  binding: boolean;
  validFrom: Date;
  validTo: Date | null;
  citation: string;
  sourceUrl: string;
};

export function isActiveAt(version: ThresholdVersion, at: Date): boolean {
  return (
    version.validFrom.getTime() <= at.getTime() &&
    (version.validTo === null || at.getTime() < version.validTo.getTime())
  );
}

export function findActiveThreshold(
  versions: readonly ThresholdVersion[],
  parameterId: string,
  jurisdiction: Jurisdiction,
  at: Date,
): ThresholdVersion | null {
  const matches = versions.filter(
    (version) =>
      version.parameterId === parameterId &&
      version.jurisdiction === jurisdiction &&
      isActiveAt(version, at),
  );
  matches.sort((left, right) => right.validFrom.getTime() - left.validFrom.getTime());
  return matches[0] ?? null;
}
