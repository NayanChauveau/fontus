import type { ListNetworksForCommune } from "./use-cases/ListNetworksForCommune";

/** Surface interne exposée à la composition uniquement. */
export type NetworkModuleFacade = {
  listNetworksForCommune: ListNetworksForCommune;
};
