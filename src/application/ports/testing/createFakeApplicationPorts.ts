import { buildParameterHistories } from "@/composition/buildParameterHistories";
import type { ApplicationPorts } from "../ApplicationPorts";

const FIXED_PING_AT = new Date("2026-09-02T08:00:00.000Z");

type PortOverrides = {
  [K in keyof ApplicationPorts]?: Partial<ApplicationPorts[K]>;
};

export function createFakeApplicationPorts(
  overrides: PortOverrides = {},
): { ports: ApplicationPorts } {
  const defaults: ApplicationPorts = {
    analyses: {
      async getByNetworkCode() {
        return {
          networkCode: "",
          windowFrom: "",
          source: "cache",
          latestSample: null,
          latestMeasurements: [],
          parameterHistories: [],
        };
      },
      summarizeHistories(measurements) {
        return buildParameterHistories(measurements);
      },
    },
    geocoding: {
      async suggest() {
        return [];
      },
      async resolve() {
        return null;
      },
    },
    health: {
      async ping() {
        return { ok: true, at: FIXED_PING_AT };
      },
    },
    comparison: {
      async compare(measurements) {
        return measurements;
      },
    },
    parameters: {
      async resolve(measurements) {
        return measurements;
      },
    },
    observability: {
      report() {},
    },
    rateLimit: {
      async consume() {
        return true;
      },
    },
    network: {
      async listByCitycode() {
        return {
          citycode: "",
          city: "",
          year: 0,
          confidence: "none",
          networks: [],
          hiddenNonResidentialCount: 0,
          selectedNetworkCode: null,
        };
      },
    },
  };

  return {
    ports: {
      ...defaults,
      ...overrides,
      analyses: { ...defaults.analyses, ...overrides.analyses },
      geocoding: { ...defaults.geocoding, ...overrides.geocoding },
      health: { ...defaults.health, ...overrides.health },
      comparison: { ...defaults.comparison, ...overrides.comparison },
      parameters: { ...defaults.parameters, ...overrides.parameters },
      observability: { ...defaults.observability, ...overrides.observability },
      rateLimit: { ...defaults.rateLimit, ...overrides.rateLimit },
      network: { ...defaults.network, ...overrides.network },
    },
  };
}
