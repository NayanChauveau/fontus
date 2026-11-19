/**
 * Performance budget of the key pages (tests/e2e/performance.spec.ts): Lighthouse with its default
 * mobile emulation and simulated throttling, on the production build. Pure functions, unit-tested in
 * tests/performance/budget.test.ts. A page under budget fails `pnpm test:performance`.
 */

export const categories = ["performance", "accessibility", "best-practices", "seo"] as const;
export type Category = (typeof categories)[number];

export interface Budget {
  /** Minimum Lighthouse score of each category, 0 to 1. */
  scores: Record<Category, number>;
  /** Largest Contentful Paint, milliseconds. */
  lcpMs: number;
  /** Cumulative Layout Shift, unitless. */
  cls: number;
  /** Total byte weight of the page and everything it loads, bytes. */
  totalBytes: number;
}

export const budget: Budget = {
  scores: { performance: 0.9, accessibility: 0.95, "best-practices": 0.95, seo: 0.9 },
  lcpMs: 2500,
  cls: 0.1,
  totalBytes: 1_500_000,
};

export type Metric = "lcpMs" | "cls" | "totalBytes";

export interface BudgetPage {
  path: string;
  /**
   * A looser limit for one category (minimum score) or metric (maximum), with its reason and the
   * owner's ruling recorded next to it; never silent, and shown in the summary table.
   */
  exceptions?: Partial<Record<Category | Metric, { limit: number; reason: string }>>;
}

/** Key pages measured on every CI run; keep the list short (each page costs about 20 s). */
// Ruling P10a (infra-traefik/.superpowers/sdd/2026-11-19-phase4-starter/progress.md): the city page
// misses the budget today. Its network list is fetched by the browser (/api/networks) after
// hydration: the list becomes the LCP element and pushes the guide below it down (one layout shift
// of 0.217). Measured on 2026-11-19 (median of 3, local): performance 85-86, LCP 2.61-2.86 s, CLS
// 0.217. The exceptions below are non-regression ceilings until the owner rules on the fix
// (server-render the list, or reserve its space); remove them once fixed.
const cityPageRuling =
  "Liste des réseaux chargée par le navigateur après hydratation : LCP tardif et décalage du guide " +
  "(CLS 0,217). Plafond de non-régression, règle P10a, à retirer une fois corrigé.";

export const pages: BudgetPage[] = [
  { path: "/" },
  {
    path: "/eau-robinet/paris",
    exceptions: {
      performance: { limit: 0.8, reason: cityPageRuling },
      lcpMs: { limit: 3000, reason: cityPageRuling },
      cls: { limit: 0.25, reason: cityPageRuling },
    },
  },
  { path: "/faq" },
];

/** The part of a Lighthouse result (LHR) that the budget reads. */
export interface LighthouseResult {
  categories: Partial<
    Record<string, { score: number | null; auditRefs?: { id: string; weight: number }[] }>
  >;
  audits: Partial<Record<string, { score: number | null; numericValue?: number }>>;
  runtimeError?: { code: string; message: string };
}

export interface Measure {
  scores: Record<Category, number | null>;
  lcpMs: number | null;
  cls: number | null;
  totalBytes: number | null;
}

const numeric = (lhr: LighthouseResult, id: string) => lhr.audits[id]?.numericValue ?? null;

export function measure(lhr: LighthouseResult): Measure {
  if (lhr.runtimeError) throw new Error(`Lighthouse : ${lhr.runtimeError.code}`);
  const scores = Object.fromEntries(
    categories.map((category) => [category, lhr.categories[category]?.score ?? null]),
  ) as Record<Category, number | null>;
  return {
    scores,
    lcpMs: numeric(lhr, "largest-contentful-paint"),
    cls: numeric(lhr, "cumulative-layout-shift"),
    totalBytes: numeric(lhr, "total-byte-weight"),
  };
}

/** Median of each value over several runs, so one noisy run neither fails nor hides a regression. */
export function median(runs: Measure[]): Measure {
  if (runs.length === 0) throw new Error("Aucune mesure");
  const middle = (values: (number | null)[]) => {
    if (values.some((value) => value === null)) return null;
    const sorted = (values as number[]).toSorted((a, b) => a - b);
    const half = Math.floor(sorted.length / 2);
    return sorted.length % 2
      ? (sorted[half] ?? null)
      : ((sorted[half - 1] ?? 0) + (sorted[half] ?? 0)) / 2;
  };
  return {
    scores: Object.fromEntries(
      categories.map((category) => [category, middle(runs.map((run) => run.scores[category]))]),
    ) as Record<Category, number | null>,
    lcpMs: middle(runs.map((run) => run.lcpMs)),
    cls: middle(runs.map((run) => run.cls)),
    totalBytes: middle(runs.map((run) => run.totalBytes)),
  };
}

/** Every way the measure misses the budget, in words; empty when the page is within budget. */
export function violations(result: Measure, page: BudgetPage, limits: Budget = budget): string[] {
  const found: string[] = [];
  for (const category of categories) {
    const min = page.exceptions?.[category]?.limit ?? limits.scores[category];
    const score = result.scores[category];
    if (score === null) found.push(`${category} : score absent`);
    else if (score < min) found.push(`${category} ${percent(score)} < ${percent(min)}`);
  }
  for (const metric of metrics) {
    const max = page.exceptions?.[metric]?.limit ?? limits[metric];
    const value = result[metric];
    const { name, format } = metricLabels[metric];
    if (value === null) found.push(`${name} : mesure absente`);
    else if (value > max) found.push(`${name} ${format(value)} > ${format(max)}`);
  }
  return found;
}

/** Audits that cost points in a category, to say why a score is low. */
export function failingAudits(lhr: LighthouseResult, category: Category): string[] {
  return (lhr.categories[category]?.auditRefs ?? [])
    .filter((ref) => ref.weight > 0)
    .filter((ref) => {
      const score = lhr.audits[ref.id]?.score;
      return score !== null && score !== undefined && score < 1;
    })
    .map((ref) => ref.id);
}

/** The page's recorded exceptions, as limits in words (`performance ≥ 80`, `LCP ≤ 3.00 s`). */
export function exceptionNotes(page: BudgetPage): string[] {
  return [
    ...categories.flatMap((category) => {
      const exception = page.exceptions?.[category];
      return exception ? [`${category} ≥ ${percent(exception.limit)}`] : [];
    }),
    ...metrics.flatMap((metric) => {
      const exception = page.exceptions?.[metric];
      const { name, format } = metricLabels[metric];
      return exception ? [`${name} ≤ ${format(exception.limit)}`] : [];
    }),
  ];
}

function percent(score: number) {
  return String(Math.round(score * 100));
}
const seconds = (ms: number) => `${(ms / 1000).toFixed(2)} s`;
const kilobytes = (bytes: number) => `${String(Math.round(bytes / 1000))} ko`;
const metrics: Metric[] = ["lcpMs", "cls", "totalBytes"];
const metricLabels: Record<Metric, { name: string; format: (value: number) => string }> = {
  lcpMs: { name: "LCP", format: seconds },
  cls: { name: "CLS", format: (value) => value.toFixed(3) },
  totalBytes: { name: "poids", format: kilobytes },
};

/** Markdown table of the medians, one row per page, for the job log and the CI summary. */
export function table(rows: { page: BudgetPage; result: Measure; problems: string[] }[]): string {
  const value = (score: number | null) => (score === null ? "—" : percent(score));
  const lines = [
    "| Page | Perf. | Access. | Bonnes pratiques | SEO | LCP | CLS | Poids | Budget |",
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- |",
    ...rows.map(({ page, result, problems }) =>
      [
        page.path,
        ...categories.map((category) => value(result.scores[category])),
        result.lcpMs === null ? "—" : seconds(result.lcpMs),
        result.cls === null ? "—" : result.cls.toFixed(3),
        result.totalBytes === null ? "—" : kilobytes(result.totalBytes),
        [
          problems.length ? `hors budget : ${problems.join(" ; ")}` : "OK",
          ...exceptionNotes(page).map((note) => `(exception : ${note})`),
        ].join(" "),
      ].join(" | "),
    ),
  ];
  return lines.map((line) => (line.startsWith("|") ? line : `| ${line} |`)).join("\n");
}
