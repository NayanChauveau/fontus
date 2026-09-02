import type { GetNetworkAnalyses } from "./use-cases/GetNetworkAnalyses";

/** Surface interne exposée à la composition uniquement. */
export type AnalysesModuleFacade = {
  getNetworkAnalyses: GetNetworkAnalyses;
};
