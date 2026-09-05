import { CH_THRESHOLDS } from "./chCatalog";
import { FR_EU_THRESHOLDS } from "./frEuCatalog";
import type { ThresholdVersion } from "./ThresholdVersion";
import { US_THRESHOLDS } from "./usCatalog";
import { WHO_THRESHOLDS } from "./whoCatalog";

export const SEEDED_THRESHOLDS: ThresholdVersion[] = [
  ...FR_EU_THRESHOLDS,
  ...CH_THRESHOLDS,
  ...US_THRESHOLDS,
  ...WHO_THRESHOLDS,
];
