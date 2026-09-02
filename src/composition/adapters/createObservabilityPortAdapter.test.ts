import { describe, expect, it, vi } from "vitest";
import { createObservabilityPortAdapter } from "./createObservabilityPortAdapter";

describe("createObservabilityPortAdapter", () => {
  it("writes a structured error to stderr", () => {
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});
    createObservabilityPortAdapter().report({
      level: "error",
      scope: "analyses",
      event: "quality_unavailable",
      code: "ANALYSES_UNAVAILABLE",
    });
    expect(logged).toHaveBeenCalled();
    logged.mockRestore();
  });
});
