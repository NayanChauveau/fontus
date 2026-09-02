import type { NormCatalog } from "../domain/createNormCatalog";
import type { NormCatalogPort } from "./ports/NormCatalogPort";

/** Surface interne exposée à la composition uniquement. */
export type NormsModuleFacade = {
  catalog: NormCatalog;
  store: NormCatalogPort;
};
