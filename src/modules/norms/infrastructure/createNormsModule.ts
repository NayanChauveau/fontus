import type { NormsModuleFacade } from "../application/public";
import { createNormCatalog } from "../domain/createNormCatalog";
import { SEEDED_THRESHOLDS } from "../domain/seededThresholds";
import { createDrizzleNormCatalog } from "./cache/createDrizzleNormCatalog";

export function createNormsModule(): NormsModuleFacade {
  return {
    catalog: createNormCatalog(SEEDED_THRESHOLDS),
    store: createDrizzleNormCatalog(),
  };
}
