export const CATALOG_REVIEW_MAX_AGE_DAYS = 30;

export type CatalogReview = {
  id: "fr-eu" | "ch" | "us" | "who";
  reviewedAt: string;
  sourceUrl: string;
};

export const CATALOG_REVIEWS: readonly CatalogReview[] = [
  {
    id: "fr-eu",
    reviewedAt: "2026-09-05",
    sourceUrl:
      "https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000046879740",
  },
  {
    id: "ch",
    reviewedAt: "2026-09-05",
    sourceUrl: "https://www.fedlex.admin.ch/eli/cc/2017/163/fr",
  },
  {
    id: "us",
    reviewedAt: "2026-09-05",
    sourceUrl:
      "https://www.epa.gov/ground-water-and-drinking-water/national-primary-drinking-water-regulations",
  },
  {
    id: "who",
    reviewedAt: "2026-09-05",
    sourceUrl: "https://www.who.int/publications/i/item/9789240045064",
  },
];

export type StaleCatalogReview = CatalogReview & { ageDays: number };

export function listStaleCatalogReviews(
  now: Date = new Date(),
  maxAgeDays: number = CATALOG_REVIEW_MAX_AGE_DAYS,
  reviews: readonly CatalogReview[] = CATALOG_REVIEWS,
): StaleCatalogReview[] {
  const todayUtc = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
  );

  return reviews.flatMap((review) => {
    const reviewedUtc = Date.parse(`${review.reviewedAt}T00:00:00.000Z`);
    if (!Number.isFinite(reviewedUtc)) {
      return [{ ...review, ageDays: Number.POSITIVE_INFINITY }];
    }
    const ageDays = Math.floor((todayUtc - reviewedUtc) / 86_400_000);
    return ageDays > maxAgeDays ? [{ ...review, ageDays }] : [];
  });
}
