import type { AnalysisSample } from "../../domain/Analysis";

export type DisImportPort = {
  listByNetwork(
    networkCode: string,
    dateMin: string,
  ): Promise<AnalysisSample[]>;
};

export const emptyDisImport: DisImportPort = {
  async listByNetwork() {
    return [];
  },
};
