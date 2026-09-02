import type { AnalysisSample } from "../../domain/Analysis";

export type CachedNetworkAnalyses = {
  networkCode: string;
  samples: AnalysisSample[];
  fetchedAt: Date;
  windowFrom: string;
};

export type AnalysesCachePort = {
  read(networkCode: string): Promise<CachedNetworkAnalyses | null>;
  write(input: {
    networkCode: string;
    samples: AnalysisSample[];
    fetchedAt: Date;
    windowFrom: string;
  }): Promise<void>;
  withNetworkLock<T>(
    networkCode: string,
    work: () => Promise<T>,
  ): Promise<T>;
};
