import type { AnalysesModuleFacade } from "../application/public";
import type { AnalysesErrorReporter } from "../application/use-cases/GetNetworkAnalyses";
import { GetNetworkAnalyses } from "../application/use-cases/GetNetworkAnalyses";
import { createDrizzleAnalysesCache } from "./cache/createDrizzleAnalysesCache";
import { createHubeauResultatsDisGateway } from "./hubeau/createHubeauResultatsDisGateway";

export function createAnalysesModule(
  reporter?: AnalysesErrorReporter,
): AnalysesModuleFacade {
  return {
    getNetworkAnalyses: new GetNetworkAnalyses(
      createHubeauResultatsDisGateway(),
      createDrizzleAnalysesCache(),
      () => new Date(),
      reporter,
    ),
  };
}
