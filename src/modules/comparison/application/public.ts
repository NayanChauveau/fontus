import type { CompareMeasurements } from "./use-cases/CompareMeasurements";

/** Surface interne exposée à la composition uniquement. */
export type ComparisonModuleFacade = {
  compareMeasurements: CompareMeasurements;
};
