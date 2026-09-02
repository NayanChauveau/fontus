import type { NetworkModuleFacade } from "../application/public";
import { ListNetworksForCommune } from "../application/use-cases/ListNetworksForCommune";
import { createDrizzleNetworkCache } from "./cache/createDrizzleNetworkCache";
import { createHubeauCommunesUdiGateway } from "./hubeau/createHubeauCommunesUdiGateway";

export function createNetworkModule(): NetworkModuleFacade {
  return {
    listNetworksForCommune: new ListNetworksForCommune(
      createHubeauCommunesUdiGateway(),
      createDrizzleNetworkCache(),
    ),
  };
}
