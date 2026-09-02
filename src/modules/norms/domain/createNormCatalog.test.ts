import { describe, expect, it } from "vitest";
import { createNormCatalog } from "./createNormCatalog";
import { FR_EU_THRESHOLDS } from "./frEuCatalog";

describe("createNormCatalog", () => {
  it("looks up the seed and ignores a duplicate add", () => {
    const catalog = createNormCatalog(FR_EU_THRESHOLDS);
    const first = catalog.list()[0];
    if (first) {
      catalog.add(first);
    }
    expect(catalog.list()).toHaveLength(FR_EU_THRESHOLDS.length);
    expect(
      catalog.findActive(
        "nitrates",
        "fr",
        new Date("2026-06-18T00:00:00.000Z"),
      )?.value,
    ).toBe(50);
  });

  it("accepts an extra imported version", () => {
    const catalog = createNormCatalog([]);
    const extra = FR_EU_THRESHOLDS[0]!;
    catalog.add(extra);
    expect(catalog.findActive(extra.parameterId, extra.jurisdiction, extra.validFrom)).toBe(
      extra,
    );
  });
});
