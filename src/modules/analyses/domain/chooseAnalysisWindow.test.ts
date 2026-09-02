import { describe, expect, it } from "vitest";
import { chooseAnalysisWindow } from "./chooseAnalysisWindow";

describe("chooseAnalysisWindow", () => {
  it("prefers the longest window under the soft cap so Bordeaux is not fully paged", () => {
    expect(
      chooseAnalysisWindow([
        { months: 36, count: 37113 },
        { months: 24, count: 22211 },
        { months: 18, count: 16576 },
        { months: 12, count: 8099 },
        { months: 6, count: 4000 },
      ]),
    ).toEqual({ months: 12, count: 8099 });
  });

  it("still prefers the longest window when counts are not pre-sorted", () => {
    expect(
      chooseAnalysisWindow([
        { months: 6, count: 4000 },
        { months: 12, count: 8099 },
        { months: 36, count: 37113 },
      ]),
    ).toEqual({ months: 12, count: 8099 });
  });

  it("falls back to the shortest window or 6 months when everything overflows", () => {
    expect(
      chooseAnalysisWindow([
        { months: 36, count: 50000 },
        { months: 6, count: 40000 },
      ]),
    ).toEqual({ months: 6, count: 40000 });
    expect(chooseAnalysisWindow([])).toEqual({ months: 6, count: 0 });
  });

  it("never picks a window above the 20 000 Hub’Eau cap when a smaller one exists", () => {
    expect(
      chooseAnalysisWindow([
        { months: 36, count: 50000 },
        { months: 12, count: 19000 },
      ]),
    ).toEqual({ months: 12, count: 19000 });
  });
});
