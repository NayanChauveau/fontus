import { describe, expect, it } from "vitest";
import {
  CATALOG_REVIEWS,
  listStaleCatalogReviews,
} from "./catalogReviews";

describe("listStaleCatalogReviews", () => {
  it("keeps a review that is at most a month old", () => {
    expect(
      listStaleCatalogReviews(new Date("2026-10-05T12:00:00.000Z")),
    ).toEqual([]);
  });

  it("flags a catalog reviewed more than a month ago", () => {
    const stale = listStaleCatalogReviews(new Date("2026-10-06T00:00:00.000Z"));
    expect(stale.map((item) => item.id).sort()).toEqual([
      "ch",
      "fr-eu",
      "us",
      "who",
    ]);
    expect(stale[0]?.ageDays).toBe(31);
  });

  it("treats an invalid review date as stale and ignores a future stamp", () => {
    expect(
      listStaleCatalogReviews(new Date("2026-09-05T00:00:00.000Z"), 30, [
        {
          id: "who",
          reviewedAt: "not-a-date",
          sourceUrl: "https://example.test/who",
        },
        {
          id: "us",
          reviewedAt: "2026-12-01",
          sourceUrl: "https://example.test/us",
        },
      ]),
    ).toEqual([
      {
        id: "who",
        reviewedAt: "not-a-date",
        sourceUrl: "https://example.test/who",
        ageDays: Number.POSITIVE_INFINITY,
      },
    ]);
  });
});

describe("catalog review freshness", () => {
  it("blocks CI when a live catalog was last opened more than a month ago", () => {
    const stale = listStaleCatalogReviews();
    expect(
      stale,
      stale
        .map(
          (item) =>
            `${item.id} reviewed ${item.reviewedAt} (${item.ageDays} days, ${item.sourceUrl})`,
        )
        .join("; ") || "bump reviewedAt in catalogReviews.ts",
    ).toEqual([]);
    expect(CATALOG_REVIEWS).toHaveLength(4);
  });
});
