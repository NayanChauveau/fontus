import type { NormsModuleFacade } from "@/modules/norms";
import type { ComparisonModuleFacade } from "../application/public";
import { CompareMeasurements } from "../application/use-cases/CompareMeasurements";

export function createComparisonModule(
  norms: NormsModuleFacade,
): ComparisonModuleFacade {
  return {
    compareMeasurements: new CompareMeasurements(norms.catalog, norms.store),
  };
}
