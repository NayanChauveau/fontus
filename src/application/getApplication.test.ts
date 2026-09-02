import { describe, expect, it } from "vitest";
import { createApplicationServices } from "./createApplicationServices";
import {
  getApplication,
  initializeApplication,
  resetApplicationBinding,
} from "./getApplication";
import { createFakeApplicationPorts } from "./ports/testing/createFakeApplicationPorts";

describe("getApplication", () => {
  it("throws before init and returns the bound services after", () => {
    resetApplicationBinding();
    expect(() => getApplication()).toThrow("Application not initialized");

    const { ports } = createFakeApplicationPorts();
    const application = createApplicationServices(ports);
    initializeApplication(() => application);

    expect(getApplication()).toBe(application);
    resetApplicationBinding();
  });
});
