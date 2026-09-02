import { describe, expect, it } from "vitest";
import { FR_EU_THRESHOLDS } from "./frEuCatalog";
import { SEEDED_THRESHOLDS } from "./seededThresholds";
import { findActiveThreshold, isActiveAt } from "./ThresholdVersion";

describe("findActiveThreshold", () => {
  it("picks the version valid at the sampling date", () => {
    const lead2026 = findActiveThreshold(
      FR_EU_THRESHOLDS,
      "lead",
      "fr",
      new Date("2026-06-18T11:40:00.000Z"),
    );
    const lead2036 = findActiveThreshold(
      FR_EU_THRESHOLDS,
      "lead",
      "eu",
      new Date("2036-01-12T00:00:00.000Z"),
    );

    expect(lead2026?.value).toBe(10);
    expect(lead2026?.kind).toBe("legal_limit");
    expect(lead2036?.value).toBe(5);
  });

  it("has no PFAS-20 limit before 12 January 2026", () => {
    expect(
      findActiveThreshold(
        FR_EU_THRESHOLDS,
        "pfas20",
        "fr",
        new Date("2025-12-31T00:00:00.000Z"),
      ),
    ).toBeNull();
    expect(
      findActiveThreshold(
        FR_EU_THRESHOLDS,
        "pfas20",
        "eu",
        new Date("2026-05-18T11:55:00.000Z"),
      )?.value,
    ).toBe(0.1);
  });

  it("never labels a quality reference as a legal limit", () => {
    const aluminium = findActiveThreshold(
      FR_EU_THRESHOLDS,
      "aluminium",
      "fr",
      new Date("2026-06-18T00:00:00.000Z"),
    );
    expect(aluminium?.kind).toBe("quality_reference");
    expect(aluminium?.binding).toBe(false);
    expect(aluminium?.kind).not.toBe("legal_limit");
  });

  it("exposes isActiveAt for a closed interval", () => {
    const version = findActiveThreshold(
      FR_EU_THRESHOLDS,
      "lead",
      "fr",
      new Date("2026-06-18T00:00:00.000Z"),
    );
    expect(version && isActiveAt(version, new Date("2026-06-18T00:00:00.000Z"))).toBe(
      true,
    );
    expect(version && isActiveAt(version, new Date("2036-01-12T00:00:00.000Z"))).toBe(
      false,
    );
  });

  it("returns null when nothing matches", () => {
    expect(
      findActiveThreshold(
        FR_EU_THRESHOLDS,
        "pfoa",
        "fr",
        new Date("2026-06-18T00:00:00.000Z"),
      ),
    ).toBeNull();
  });
});

describe("CH / US versions", () => {
  it("versions Swiss lead and US PFOA at the sampling date", () => {
    const leadBefore = findActiveThreshold(
      SEEDED_THRESHOLDS,
      "lead",
      "ch",
      new Date("2026-07-31T00:00:00.000Z"),
    );
    const leadAfter = findActiveThreshold(
      SEEDED_THRESHOLDS,
      "lead",
      "ch",
      new Date("2026-08-01T00:00:00.000Z"),
    );
    const pfoaUs = findActiveThreshold(
      SEEDED_THRESHOLDS,
      "pfoa",
      "us",
      new Date("2026-05-18T00:00:00.000Z"),
    );
    const leadUs = findActiveThreshold(
      SEEDED_THRESHOLDS,
      "lead",
      "us",
      new Date("2026-06-18T00:00:00.000Z"),
    );

    expect(leadBefore?.value).toBe(10);
    expect(leadAfter?.value).toBe(5);
    expect(pfoaUs?.value).toBe(0.004);
    expect(pfoaUs?.kind).toBe("legal_limit");
    expect(leadUs?.kind).toBe("quality_reference");
    expect(leadUs?.binding).toBe(false);
  });
});
