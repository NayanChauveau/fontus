import type { AnalysesModuleFacade } from "../application/public";
import { GetNetworkAnalyses } from "../application/use-cases/GetNetworkAnalyses";
import { createDrizzleAnalysesCache } from "./cache/createDrizzleAnalysesCache";
import { createHubeauResultatsDisGateway } from "./hubeau/createHubeauResultatsDisGateway";

export function createAnalysesModule(): AnalysesModuleFacade {
  return {
    getNetworkAnalyses: new GetNetworkAnalyses(
      createHubeauResultatsDisGateway(),
      createDrizzleAnalysesCache(),
    ),
  };
}
