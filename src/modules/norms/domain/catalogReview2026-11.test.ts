import { describe, expect, it } from "vitest";
import { CATALOG_REVIEWS } from "./catalogReviews";
import { CH_THRESHOLDS } from "./chCatalog";
import { FR_EU_THRESHOLDS } from "./frEuCatalog";
import { SEEDED_THRESHOLDS } from "./seededThresholds";
import { findActiveThreshold, type Jurisdiction } from "./ThresholdVersion";
import { US_THRESHOLDS } from "./usCatalog";
import { WHO_THRESHOLDS } from "./whoCatalog";

// Corrections from the catalog review of 2026-11-17 (official texts re-read).
const at = (iso: string) => new Date(`${iso}T00:00:00.000Z`);
const active = (parameterId: string, jurisdiction: Jurisdiction, iso: string) =>
  findActiveThreshold(SEEDED_THRESHOLDS, parameterId, jurisdiction, at(iso));

describe("catalog review 2026-11-17", () => {
  it("US PFAS MCLs only apply from 26 April 2029 (40 CFR 141.60)", () => {
    for (const id of ["pfoa", "pfos", "pfhxs", "pfna"]) {
      expect(active(id, "us", "2029-04-25")).toBeNull();
      expect(active(id, "us", "2029-04-26")?.binding).toBe(true);
    }
  });

  it("US lead action level goes from 15 to 10 µg/L on 1 November 2027 (LCRI)", () => {
    expect(active("lead", "us", "2027-10-31")?.value).toBe(15);
    const lcri = active("lead", "us", "2027-11-01");
    expect(lcri?.value).toBe(10);
    expect(lcri?.binding).toBe(false);
  });

  it("US start dates follow 40 CFR 141", () => {
    expect(active("ecoli", "us", "2016-03-31")).toBeNull();
    expect(active("ecoli", "us", "2016-04-01")).not.toBeNull();
    expect(active("uranium", "us", "2003-12-07")).toBeNull();
    expect(active("uranium", "us", "2003-12-08")).not.toBeNull();
    expect(active("antimony", "us", "1994-01-16")).toBeNull();
    expect(active("antimony", "us", "1994-01-17")).not.toBeNull();
    expect(active("fluoride", "us", "1987-10-02")).not.toBeNull();
  });

  it("Swiss lead stays enforceable at 10 µg/L until 31 January 2036 (OPBD art. 16a al. 2)", () => {
    expect(active("lead", "ch", "2026-11-17")?.value).toBe(10);
    expect(active("lead", "ch", "2036-01-31")?.value).toBe(10);
    expect(active("lead", "ch", "2036-02-01")?.value).toBe(5);
  });

  it("Swiss sources point to the OPBD (eli/cc/2017/153) and microbiology to annex 1", () => {
    for (const version of CH_THRESHOLDS) {
      expect(version.sourceUrl).not.toContain("eli/cc/2017/163");
    }
    for (const id of ["ecoli:ch", "enterococci:ch"]) {
      expect(CH_THRESHOLDS.find((v) => v.id === id)?.citation).toContain("annexe 1");
    }
  });

  it("French lead and chromium tighten on 1 January 2036, EU on 12 January 2036", () => {
    expect(active("lead", "fr", "2035-12-31")?.value).toBe(10);
    expect(active("lead", "fr", "2036-01-01")?.value).toBe(5);
    expect(active("chromium", "fr", "2036-01-01")?.value).toBe(25);
    expect(active("lead", "eu", "2036-01-11")?.value).toBe(10);
    expect(active("lead", "eu", "2036-01-12")?.value).toBe(5);
    expect(active("chromium", "eu", "2036-01-11")?.value).toBe(50);
  });

  it("the French PFAS-20 limit applies from 1 January 2023, the EU one from 12 January 2026", () => {
    expect(active("pfas20", "fr", "2023-01-01")?.value).toBe(0.1);
    expect(active("pfas20", "eu", "2026-01-11")).toBeNull();
  });

  it("WHO points to the 2026 edition and dates barium and manganese values", () => {
    for (const version of WHO_THRESHOLDS) {
      expect(version.sourceUrl).toBe("https://www.who.int/publications/i/item/9789240121225");
    }
    expect(active("barium", "who", "2016-06-01")?.value).toBe(0.7);
    expect(active("barium", "who", "2026-11-17")?.value).toBe(1.3);
    expect(active("manganese", "who", "2021-06-01")).toBeNull();
    expect(active("manganese", "who", "2026-11-17")?.value).toBe(80);
    expect(active("manganese", "who", "2026-11-17")?.citation).not.toContain("3e addenda)");
  });

  it("review entries point to the corrected sources", () => {
    const byId = Object.fromEntries(CATALOG_REVIEWS.map((r) => [r.id, r]));
    expect(byId.ch.sourceUrl).toBe("https://www.fedlex.admin.ch/eli/cc/2017/153/fr");
    expect(byId.who.sourceUrl).toBe("https://www.who.int/publications/i/item/9789240121225");
  });

  it("keeps every existing threshold id (ids are upserted into the database)", () => {
    const ids = new Set(SEEDED_THRESHOLDS.map((v) => v.id));
    for (const id of [
      "pfoa:us", "pfos:us", "pfhxs:us", "pfna:us", "lead:us", "ecoli:us",
      "lead:ch:10", "lead:ch:5", "lead:fr:10", "lead:fr:5", "lead:eu:10", "lead:eu:5",
      "chromium:fr:50", "chromium:fr:25", "pfas20:fr:2026", "pfas20:eu:2026",
      "barium:who", "manganese:who",
    ]) {
      expect(ids.has(id), id).toBe(true);
    }
    expect(new Set(SEEDED_THRESHOLDS.map((v) => v.id)).size).toBe(SEEDED_THRESHOLDS.length);
    expect(US_THRESHOLDS.length + FR_EU_THRESHOLDS.length).toBeGreaterThan(0);
  });
});
