import type { ParametersModuleFacade } from "../application/public";
import { ResolveMeasurements } from "../application/use-cases/ResolveMeasurements";
import { createParameterCatalog } from "../domain/createParameterCatalog";
import { PRIORITY_PARAMETERS } from "../domain/priorityCatalog";
import { createDrizzleParameterCatalog } from "./cache/createDrizzleParameterCatalog";

export function createParametersModule(): ParametersModuleFacade {
  return {
    resolveMeasurements: new ResolveMeasurements(
      createParameterCatalog(PRIORITY_PARAMETERS),
      createDrizzleParameterCatalog(),
    ),
  };
}
