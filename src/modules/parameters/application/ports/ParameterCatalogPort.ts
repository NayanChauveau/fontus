import type { CanonicalParameter } from "../../domain/Parameter";
import type { SeenParameterCode } from "../../domain/createParameterCatalog";

export type ParameterCatalogPort = {
  persist(parameter: CanonicalParameter): Promise<void>;
  listImported(): Promise<CanonicalParameter[]>;
  listSeenCodes(): Promise<SeenParameterCode[]>;
};
