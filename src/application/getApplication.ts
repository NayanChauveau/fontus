import type { ApplicationServices } from "./createApplicationServices";

let resolveServices: (() => ApplicationServices) | null = null;

export function initializeApplication(
  getServices: () => ApplicationServices,
): void {
  resolveServices = getServices;
}

export function getApplication(): ApplicationServices {
  if (!resolveServices) {
    throw new Error(
      "Application not initialized. Call initializeApplication() from the app bootstrap.",
    );
  }
  return resolveServices();
}

export function resetApplicationBinding(): void {
  resolveServices = null;
}
