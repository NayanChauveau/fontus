import assert from "node:assert/strict";
import { test } from "vitest";
import {
  budget,
  exceptionNotes,
  failingAudits,
  measure,
  median,
  pages,
  table,
  violations,
  type LighthouseResult,
  type Measure,
} from "./budget";

const lhr = (overrides: Partial<Record<string, number>> = {}): LighthouseResult => ({
  categories: {
    performance: {
      score: overrides["performance"] ?? 0.98,
      auditRefs: [{ id: "lcp", weight: 25 }],
    },
    accessibility: {
      score: overrides["accessibility"] ?? 1,
      auditRefs: [
        { id: "color-contrast", weight: 7 },
        { id: "manual", weight: 0 },
      ],
    },
    "best-practices": { score: overrides["best-practices"] ?? 1 },
    seo: { score: overrides["seo"] ?? 1 },
  },
  audits: {
    "largest-contentful-paint": { score: 1, numericValue: overrides["lcp"] ?? 1200 },
    "cumulative-layout-shift": { score: 1, numericValue: overrides["cls"] ?? 0.01 },
    "total-byte-weight": { score: 1, numericValue: overrides["bytes"] ?? 300_000 },
    "color-contrast": { score: 0 },
    manual: { score: 0 },
    lcp: { score: 1 },
  },
});

test("the budget is the one agreed for every site (P10)", () => {
  assert.deepEqual(budget, {
    scores: { performance: 0.9, accessibility: 0.95, "best-practices": 0.95, seo: 0.9 },
    lcpMs: 2500,
    cls: 0.1,
    totalBytes: 1_500_000,
  });
  assert.ok(pages.length > 0);
  for (const page of pages) {
    assert.match(page.path, /^\/[a-z0-9/-]*$/);
    for (const exception of Object.values(page.exceptions ?? {}))
      assert.ok(exception.reason.length > 40, `${page.path} : exception sans raison`);
  }
});

test("a page within budget has no violation", () => {
  assert.deepEqual(violations(measure(lhr()), { path: "/fr" }), []);
});

test("each category, LCP, CLS and weight fail on their own", () => {
  const cases: [Partial<Record<string, number>>, RegExp][] = [
    [{ performance: 0.89 }, /^performance 89 < 90$/],
    [{ accessibility: 0.94 }, /^accessibility 94 < 95$/],
    [{ "best-practices": 0.9 }, /^best-practices 90 < 95$/],
    [{ seo: 0.85 }, /^seo 85 < 90$/],
    [{ lcp: 2600 }, /^LCP 2\.60 s > 2\.50 s$/],
    [{ cls: 0.15 }, /^CLS 0\.150 > 0\.100$/],
    [{ bytes: 1_600_000 }, /^poids 1600 ko > 1500 ko$/],
  ];
  for (const [overrides, expected] of cases) {
    const found = violations(measure(lhr(overrides)), { path: "/fr" });
    assert.equal(found.length, 1, JSON.stringify(overrides));
    assert.match(found[0] ?? "", expected);
  }
});

test("limits are inclusive: exactly on budget passes", () => {
  const found = violations(
    measure(lhr({ performance: 0.9, accessibility: 0.95, lcp: 2500, cls: 0.1, bytes: 1_500_000 })),
    { path: "/fr" },
  );
  assert.deepEqual(found, []);
});

test("a recorded exception loosens one category or metric only", () => {
  const page = {
    path: "/fr",
    exceptions: {
      seo: { limit: 0.6, reason: "page volontairement noindex" },
      cls: { limit: 0.25, reason: "décalage connu, décision du propriétaire" },
    },
  };
  assert.deepEqual(violations(measure(lhr({ seo: 0.66 })), page), []);
  assert.deepEqual(violations(measure(lhr({ seo: 0.5 })), page), ["seo 50 < 60"]);
  assert.deepEqual(violations(measure(lhr({ seo: 0.66, accessibility: 0.9 })), page), [
    "accessibility 90 < 95",
  ]);
  assert.deepEqual(violations(measure(lhr({ cls: 0.2 })), page), []);
  assert.deepEqual(violations(measure(lhr({ cls: 0.3, lcp: 2600 })), page), [
    "LCP 2.60 s > 2.50 s",
    "CLS 0.300 > 0.250",
  ]);
  assert.deepEqual(exceptionNotes(page), ["seo ≥ 60", "CLS ≤ 0.250"]);
  assert.deepEqual(exceptionNotes({ path: "/fr" }), []);
});

test("a missing score or metric is a violation, a Lighthouse error is thrown", () => {
  const broken = lhr();
  broken.categories["seo"] = { score: null };
  delete broken.audits["total-byte-weight"];
  assert.deepEqual(violations(measure(broken), { path: "/fr" }), [
    "seo : score absent",
    "poids : mesure absente",
  ]);
  assert.throws(
    () => measure({ ...lhr(), runtimeError: { code: "NO_FCP", message: "x" } }),
    /NO_FCP/,
  );
});

test("the median of runs keeps one noisy run from deciding", () => {
  const runs: Measure[] = [
    measure(lhr({ performance: 0.95, lcp: 1000 })),
    measure(lhr({ performance: 0.6, lcp: 4000 })),
    measure(lhr({ performance: 0.93, lcp: 1100 })),
  ];
  const result = median(runs);
  assert.equal(result.scores.performance, 0.93);
  assert.equal(result.lcpMs, 1100);
  assert.equal(median(runs.slice(0, 2)).lcpMs, 2500);
  assert.throws(() => median([]));
});

test("failing audits name what costs points, ignoring unweighted ones", () => {
  assert.deepEqual(failingAudits(lhr(), "accessibility"), ["color-contrast"]);
  assert.deepEqual(failingAudits(lhr(), "performance"), []);
  assert.deepEqual(failingAudits(lhr(), "seo"), []);
});

test("the summary table shows the medians and the verdict of each page", () => {
  const output = table([
    { page: { path: "/fr" }, result: measure(lhr()), problems: [] },
    { page: { path: "/en" }, result: measure(lhr({ seo: 0.8 })), problems: ["seo 80 < 90"] },
    {
      page: { path: "/fr/x", exceptions: { lcpMs: { limit: 3000, reason: "r" } } },
      result: measure(lhr()),
      problems: [],
    },
  ]);
  const lines = output.split("\n");
  assert.equal(lines.length, 5);
  assert.match(lines[4] ?? "", /\| OK \(exception : LCP ≤ 3\.00 s\) \|$/);
  assert.equal(lines[2], "| /fr | 98 | 100 | 100 | 100 | 1.20 s | 0.010 | 300 ko | OK |");
  assert.match(lines[3] ?? "", /\| \/en \| .* \| 80 \| .*hors budget : seo 80 < 90 \|$/);
});
