import type { NormsModuleFacade } from "../application/public";
import { createNormCatalog } from "../domain/createNormCatalog";
import { FR_EU_THRESHOLDS } from "../domain/frEuCatalog";
import { createDrizzleNormCatalog } from "./cache/createDrizzleNormCatalog";

export function createNormsModule(): NormsModuleFacade {
  return {
    catalog: createNormCatalog(FR_EU_THRESHOLDS),
    store: createDrizzleNormCatalog(),
  };
}
