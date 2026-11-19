import { appendFileSync } from "node:fs";
import { createServer } from "node:net";
import { chromium, expect, test } from "@playwright/test";
import {
  categories,
  failingAudits,
  measure,
  median,
  pages,
  table,
  violations,
  type BudgetPage,
  type LighthouseResult,
  type Measure,
} from "../performance/budget";
import { answerDataApis } from "./data-fixtures";

/**
 * Performance budget (`pnpm test:performance`): Lighthouse, default mobile emulation and simulated
 * throttling, on the production build served by scripts/e2e.mjs, in Playwright's Chromium. The data
 * API calls are answered from the recorded fixtures, as in the CSP suite. Each page is measured
 * several times and the median checked against tests/performance/budget.ts.
 */
const runs = Number(process.env.PERFORMANCE_RUNS || 3);

async function freePort() {
  return new Promise<number>((resolve, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      server.close(() =>
        address && typeof address === "object" ? resolve(address.port) : reject(new Error("port")),
      );
    });
  });
}

test("Lighthouse budget of the key pages", async ({ baseURL }) => {
  test.setTimeout(60_000 * runs * pages.length);
  const port = await freePort();
  // A persistent context so that its routes also apply to the tab Lighthouse opens over CDP;
  // full Chromium in new headless mode, without Playwright's viewport (Lighthouse emulates mobile).
  const context = await chromium.launchPersistentContext("", {
    channel: "chromium",
    viewport: null,
    args: [`--remote-debugging-port=${port}`],
  });
  const rows: { page: BudgetPage; result: Measure; problems: string[] }[] = [];
  const audits: string[] = [];
  try {
    await answerDataApis(context);
    // ESM-only package, loaded at run time from this CommonJS-compiled file.
    const { default: lighthouse } = await import("lighthouse");
    for (const page of pages) {
      const measures: Measure[] = [];
      let last: LighthouseResult | undefined;
      for (let run = 0; run < runs; run++) {
        const result = await lighthouse(`${baseURL}${page.path}`, {
          port,
          logLevel: "error",
          output: "json",
          onlyCategories: [...categories],
        });
        if (!result) throw new Error(`Lighthouse sans résultat : ${page.path}`);
        last = result.lhr;
        measures.push(measure(last));
      }
      const result = median(measures);
      const problems = violations(result, page);
      rows.push({ page, result, problems });
      if (problems.length && last) {
        for (const category of categories) {
          audits.push(
            `${page.path} ${category} : ${failingAudits(last, category).join(", ") || "—"}`,
          );
        }
      }
    }
  } finally {
    await context.close();
  }
  const summary = `Budget de performance (Lighthouse mobile, médiane de ${runs} mesures)\n\n${table(rows)}\n`;
  console.log(summary);
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
  const failures = rows.flatMap((row) =>
    row.problems.map((problem) => `${row.page.path} : ${problem}`),
  );
  expect(failures, `Pages hors budget ; audits en cause :\n${audits.join("\n")}`).toEqual([]);
});
