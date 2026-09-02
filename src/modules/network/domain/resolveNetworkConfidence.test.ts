import { describe, expect, it } from "vitest";
import { resolveNetworkConfidence } from "./resolveNetworkConfidence";

describe("resolveNetworkConfidence", () => {
  it("is none when the commune has no UDI", () => {
    expect(resolveNetworkConfidence(0)).toBe("none");
  });

  it("is exact only when a single UDI serves the commune", () => {
    expect(resolveNetworkConfidence(1)).toBe("exact");
  });

  it("is ambiguous for Bordeaux-sized communes — never invents a unique network", () => {
    expect(resolveNetworkConfidence(6)).toBe("ambiguous");
    expect(resolveNetworkConfidence(2)).toBe("ambiguous");
  });
});
