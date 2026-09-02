import { describe, expect, it } from "vitest";
import { isFreshEmptyYear, isFreshSync } from "./NetworkConfidence";

describe("NetworkConfidence freshness", () => {
  const now = new Date("2026-09-02T10:00:00.000Z");

  it("uses seven days for a populated year and 24 hours for an empty year", () => {
    expect(isFreshSync(new Date("2026-08-27T10:00:00.000Z"), now)).toBe(true);
    expect(isFreshSync(new Date("2026-08-25T10:00:00.000Z"), now)).toBe(false);
    expect(isFreshEmptyYear(new Date("2026-09-02T08:00:00.000Z"), now)).toBe(
      true,
    );
    expect(isFreshEmptyYear(new Date("2026-09-01T10:00:00.000Z"), now)).toBe(
      false,
    );
  });
});
