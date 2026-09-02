import type { ApplicationPorts } from "../ApplicationPorts";

const FIXED_PING_AT = new Date("2026-09-02T08:00:00.000Z");

export function createFakeApplicationPorts(
  overrides: Partial<ApplicationPorts> = {},
): { ports: ApplicationPorts } {
  const ports: ApplicationPorts = {
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
    ...overrides,
  };

  return { ports };
}
