import { describe, expect, it } from "vitest";
import { createNormCatalog } from "./createNormCatalog";
import { FR_EU_THRESHOLDS } from "./frEuCatalog";
import { SEEDED_THRESHOLDS } from "./seededThresholds";

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

  it("exposes Swiss and US PFOA limits from the combined seed", () => {
    const catalog = createNormCatalog(SEEDED_THRESHOLDS);
    const at = new Date("2026-05-18T00:00:00.000Z");
    expect(catalog.findActive("pfoa", "fr", at)).toBeNull();
    expect(catalog.findActive("pfoa", "ch", at)?.value).toBe(0.5);
    expect(catalog.findActive("pfoa", "us", at)?.value).toBe(0.004);
    expect(catalog.findActive("nitrates", "us", at)?.value).toBe(44.3);
    expect(catalog.findActive("nitrates", "who", at)?.value).toBe(50);
    expect(catalog.findActive("nitrates", "who", at)?.kind).toBe(
      "quality_reference",
    );
    expect(catalog.findActive("pfoa", "who", at)).toBeNull();
    expect(catalog.findActive("cadmium", "ch", at)?.value).toBe(3);
    expect(catalog.findActive("fluoride", "fr", at)?.value).toBe(1.5);
    expect(catalog.findActive("fluoride", "who", at)?.value).toBe(1.5);
    expect(catalog.findActive("boron", "ch", at)?.value).toBe(1);
    expect(catalog.findActive("antimony", "us", at)?.value).toBe(6);
    expect(catalog.findActive("chromium6", "fr", at)?.value).toBe(6);
    expect(catalog.findActive("chromium6", "eu", at)).toBeNull();
    expect(catalog.findActive("ammonium", "fr", at)?.value).toBe(0.1);
    expect(catalog.findActive("ammonium", "eu", at)?.value).toBe(0.5);
  });
});
