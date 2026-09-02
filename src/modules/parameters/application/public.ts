import type { ResolveMeasurements } from "./use-cases/ResolveMeasurements";

/** Surface interne exposée à la composition uniquement. */
export type ParametersModuleFacade = {
  resolveMeasurements: ResolveMeasurements;
};
