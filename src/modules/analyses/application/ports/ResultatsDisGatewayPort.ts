import type { AnalysisSample } from "../../domain/Analysis";

export type ResultatsDisPage = {
  count: number;
  next: string | null;
  samples: AnalysisSample[];
};

export type ResultatsDisGatewayPort = {
  count(networkCode: string, dateMin: string): Promise<number>;
  listPage(
    networkCode: string,
    dateMin: string,
    pageUrl?: string,
  ): Promise<ResultatsDisPage>;
};
