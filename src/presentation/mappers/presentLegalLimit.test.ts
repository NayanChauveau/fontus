import { describe, expect, it } from "vitest";
import { FR_EU_THRESHOLDS } from "@/modules/norms/domain/frEuCatalog";
import { findActiveThreshold } from "@/modules/norms/domain/ThresholdVersion";
import {
  formatLimitDate,
  presentFrenchLegalLimits,
} from "./presentLegalLimit";

const AT = new Date("2026-09-05T00:00:00.000Z");

describe("presentFrenchLegalLimits", () => {
  it("reads current FR legal limits from the seed, without inventing values", () => {
    const nitrates = presentFrenchLegalLimits("nitrates", AT, "fr-FR");
    const pfas = presentFrenchLegalLimits("pfas20", AT, "fr-FR");
    const lead = presentFrenchLegalLimits("lead", AT, "fr-FR");
    const seedNitrates = findActiveThreshold(
      FR_EU_THRESHOLDS,
      "nitrates",
      "fr",
      AT,
    );
    const seedPfas = findActiveThreshold(FR_EU_THRESHOLDS, "pfas20", "fr", AT);
    const seedLead = findActiveThreshold(FR_EU_THRESHOLDS, "lead", "fr", AT);

    expect(seedNitrates?.value).toBe(50);
    expect(seedPfas?.value).toBe(0.1);
    expect(seedLead?.value).toBe(10);
    expect(nitrates?.current.valueLabel).toBe("50 mg/L");
    expect(pfas?.current.valueLabel).toBe("0,1 µg/L");
    expect(lead?.current.valueLabel).toBe("10 µg/L");
    expect(nitrates?.upcoming).toBeNull();
    expect(pfas?.upcoming).toBeNull();
    expect(lead?.upcoming?.valueLabel).toBe("5 µg/L");
    expect(lead?.upcoming?.validFrom.toISOString()).toBe(
      "2036-01-12T00:00:00.000Z",
    );
    expect(nitrates?.current.citation).toBe(seedNitrates?.citation);
    expect(nitrates?.current.sourceUrl).toBe(seedNitrates?.sourceUrl);
  });

  it("returns null when no French legal limit exists", () => {
    expect(presentFrenchLegalLimits("hardness", AT, "fr-FR")).toBeNull();
    expect(presentFrenchLegalLimits("pfoa", AT, "fr-FR")).toBeNull();
  });

  it("formats the upcoming date in UTC", () => {
    expect(formatLimitDate(new Date("2036-01-12T00:00:00.000Z"), "fr-FR")).toBe(
      "12 janvier 2036",
    );
  });
});
