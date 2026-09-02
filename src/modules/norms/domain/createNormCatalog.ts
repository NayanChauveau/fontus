import {
  findActiveThreshold,
  type Jurisdiction,
  type ThresholdVersion,
} from "./ThresholdVersion";

export type NormCatalog = {
  findActive(
    parameterId: string,
    jurisdiction: Jurisdiction,
    at: Date,
  ): ThresholdVersion | null;
  add(version: ThresholdVersion): void;
  list(): ThresholdVersion[];
};

export function createNormCatalog(seed: ThresholdVersion[]): NormCatalog {
  const versions = [...seed];

  return {
    findActive(parameterId, jurisdiction, at) {
      return findActiveThreshold(versions, parameterId, jurisdiction, at);
    },
    add(version) {
      if (versions.some((item) => item.id === version.id)) {
        return;
      }
      versions.push(version);
    },
    list() {
      return [...versions];
    },
  };
}
