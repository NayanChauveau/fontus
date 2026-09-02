import type { ApplicationPorts } from "../ApplicationPorts";

const FIXED_PING_AT = new Date("2026-09-02T08:00:00.000Z");

export function createFakeApplicationPorts(
  overrides: Partial<ApplicationPorts> = {},
): { ports: ApplicationPorts } {
  const ports: ApplicationPorts = {
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
    ...overrides,
  };

  return { ports };
}
