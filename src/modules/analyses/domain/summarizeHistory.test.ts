import { describe, expect, it } from "vitest";
import { summarizeHistory } from "./summarizeHistory";

describe("summarizeHistory", () => {
  it("computes min, max, median and a rising trend", () => {
    const summary = summarizeHistory([
      { value: 5, qualifier: "eq" },
      { value: 8, qualifier: "eq" },
      { value: 12, qualifier: "eq" },
      { value: 20, qualifier: "eq" },
    ]);
    expect(summary.min).toBe(5);
    expect(summary.max).toBe(20);
    expect(summary.median).toBe(10);
    expect(summary.count).toBe(4);
    expect(summary.trend).toBe("rising");
    expect(summary.loqChanged).toBe(false);
  });

  it("marks a falling, stable or insufficient series", () => {
    expect(
      summarizeHistory([
        { value: 20, qualifier: "eq" },
        { value: 12, qualifier: "eq" },
        { value: 5, qualifier: "eq" },
      ]).trend,
    ).toBe("falling");
    expect(
      summarizeHistory([
        { value: 10, qualifier: "eq" },
        { value: 10.2, qualifier: "eq" },
        { value: 10.5, qualifier: "eq" },
      ]).trend,
    ).toBe("stable");
    expect(
      summarizeHistory([
        { value: 10, qualifier: "eq" },
        { value: 20, qualifier: "eq" },
      ]).trend,
    ).toBe("insufficient");
  });

  it("flags an LQ change and ignores non-numeric points for stats", () => {
    const summary = summarizeHistory([
      { value: 12, qualifier: "eq" },
      { value: 0.01, qualifier: "lt" },
      { value: null, qualifier: "lt" },
    ]);
    expect(summary.loqChanged).toBe(true);
    expect(summary.count).toBe(2);
    expect(summary.median).toBe(6.005);
  });

  it("flags a changing LQ numeric value", () => {
    expect(
      summarizeHistory([
        { value: 0.01, qualifier: "lt" },
        { value: 0.05, qualifier: "lt" },
      ]).loqChanged,
    ).toBe(true);
    expect(summarizeHistory([]).min).toBeNull();
    expect(
      summarizeHistory([
        { value: 0.01, qualifier: "lt" },
        { value: 0.01, qualifier: "lt" },
      ]).loqChanged,
    ).toBe(false);
  });
});
