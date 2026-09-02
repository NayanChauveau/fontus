import type { ThresholdVersion } from "../../domain/ThresholdVersion";

export type NormCatalogPort = {
  persist(version: ThresholdVersion): Promise<void>;
  list(): Promise<ThresholdVersion[]>;
};
