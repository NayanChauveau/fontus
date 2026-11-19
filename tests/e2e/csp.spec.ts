import { expect, test as base, type Page } from "@playwright/test";
import { answerDataApis, NETWORK_CODE } from "./data-fixtures";

/**
 * The production build in a real browser under its Content Security Policy (src/proxy.ts,
 * src/shared/infrastructure/http/csp.ts): every page and interaction of the suite must run without
 * a single `securitypolicyviolation` event, CSP console message or console error.
 *
 * The data API calls (Hub'Eau and the address API behind them, cached in Postgres) are answered
 * from tests/e2e/fixtures, recorded from the real endpoints: the suite needs neither the network
 * nor a database, and the browser still enforces the policy on those requests.
 */
type Problems = { violations: string[]; consoleErrors: string[] };

async function watch(page: Page): Promise<Problems> {
  const problems: Problems = { violations: [], consoleErrors: [] };
  await page.exposeFunction("__reportCspViolation", (line: string) => {
    problems.violations.push(line);
  });
  // Injected by Playwright, not by the page: not subject to the policy it watches.
  await page.addInitScript(() => {
    document.addEventListener("securitypolicyviolation", (event) => {
      (window as unknown as { __reportCspViolation(line: string): void }).__reportCspViolation(
        `${location.pathname}: ${event.effectiveDirective} blocked ${event.blockedURI || "inline"}`,
      );
    });
  });
  page.on("console", (message) => {
    if (message.type() === "error" || /Content Security Policy/i.test(message.text())) {
      problems.consoleErrors.push(`${page.url()}: ${message.text()}`);
    }
  });
  page.on("pageerror", (error) => {
    problems.consoleErrors.push(`${page.url()}: ${error.message}`);
  });
  await answerDataApis(page);
  return problems;
}

// Every test watches its page; only the watcher's own check (below) expects a violation.
const test = base.extend<{ problems: Problems; expectClean: boolean }>({
  expectClean: [true, { option: true }],
  problems: [
    async ({ page, expectClean }, use) => {
      const problems = await watch(page);
      await use(problems);
      if (expectClean) {
        expect(problems.violations, "Violations de la Content Security Policy").toEqual([]);
        expect(problems.consoleErrors, "Erreurs dans la console").toEqual([]);
      }
    },
    { auto: true },
  ],
});

async function open(page: Page, path: string) {
  const response = await page.goto(path);
  expect(response?.status(), path).toBe(200);
  await page.waitForLoadState("networkidle");
}

test("pages get a nonce policy, the API a sandbox, and only nonced scripts run", async ({
  request,
}) => {
  const policies: string[] = [];
  for (const path of ["/", "/faq"]) {
    const response = await request.get(path);
    const policy = response.headers()["content-security-policy"] ?? "";
    policies.push(policy);
    const nonce = /'nonce-([A-Za-z0-9+/=]+)'/.exec(policy)?.[1];
    expect(nonce, path).toBeTruthy();
    expect(policy).toContain("'strict-dynamic'");
    expect(policy).not.toContain("unsafe-inline");
    expect(policy).not.toContain("unsafe-eval");
    expect(policy).toContain("frame-ancestors 'none'");
    expect(policy).toContain("report-uri /api/csp-report");
    expect(response.headers()["reporting-endpoints"]).toBe('csp="/api/csp-report"');
    expect(response.headers()["strict-transport-security"]).toBe(
      "max-age=31536000; includeSubDomains",
    );
    expect(response.headers()["x-content-type-options"]).toBe("nosniff");
    expect(response.headers()["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(response.headers()["permissions-policy"]).toBe(
      "camera=(), microphone=(), geolocation=()",
    );
    // Every script the browser would run carries this request's nonce; JSON-LD is data.
    const html = await response.text();
    const scripts = [...html.matchAll(/<script\b([^>]*)>/g)].map((match) => match[1] ?? "");
    const executable = scripts.filter((attributes) => !/type="application\/ld\+json"/.test(attributes));
    expect(executable.length).toBeGreaterThan(0);
    for (const attributes of executable) {
      expect(attributes, path).toContain(`nonce="${nonce}"`);
    }
  }
  expect(policies[0]).not.toBe(policies[1]);

  const api = await request.get("/api/ready");
  expect(api.headers()["content-security-policy"]).toBe(
    "default-src 'none'; frame-ancestors 'none'; sandbox",
  );
  expect(api.headers()["x-content-type-options"]).toBe("nosniff");
});

test.describe("negative control", () => {
  test.use({ expectClean: false });

  test("the watcher sees a blocked script, and the report endpoint accepts reports", async ({
    page,
    problems,
    request,
  }) => {
    // An injected inline script, as an XSS in the HTML would be: same response, same policy.
    await page.route("**/faq", async (route) => {
      const response = await route.fetch();
      const body = (await response.text()).replace(
        "</body>",
        "<script>window.__injected = true</script></body>",
      );
      await route.fulfill({ response, body });
    });
    await open(page, "/faq");
    await expect.poll(() => problems.violations.length).toBeGreaterThan(0);
    expect(problems.violations[0]).toContain("/faq: script-src-elem blocked inline");
    expect(await page.evaluate(() => "__injected" in window)).toBe(false);

    const report = await request.post("/api/csp-report", {
      headers: { "content-type": "application/csp-report" },
      data: JSON.stringify({
        "csp-report": {
          "document-uri": "http://127.0.0.1/",
          "violated-directive": "script-src-elem",
          "blocked-uri": "inline",
        },
      }),
    });
    expect(report.status()).toBe(204);
  });
});

test("home page", async ({ page }) => {
  await open(page, "/");
  await expect(page.getByRole("combobox")).toBeVisible();
});

test("city page lists the distribution networks", async ({ page }) => {
  await open(page, "/eau-robinet/paris");
  await expect(page.getByText("CENTRE").first()).toBeVisible();
});

test("UDI quality page shows the analyses", async ({ page }) => {
  await open(page, `/eau-robinet/paris/${NETWORK_CODE}`);
  await expect(page.getByText(/nitrates/i).first()).toBeVisible();
});

test("FAQ", async ({ page }) => {
  await open(page, "/faq");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("address search leads to the city's networks", async ({ page }) => {
  await open(page, "/");
  await page.getByRole("combobox").fill("10 rue de rivoli paris");
  await page.getByRole("option", { name: /10 Rue de Rivoli/ }).click();
  await expect(page).toHaveURL(/\/eau-robinet\/paris\?adresse=/);
  await expect(page.getByText("CENTRE").first()).toBeVisible();
});

test("theme switch applies and survives a reload (bootstrap script under the nonce)", async ({ page }) => {
  await open(page, "/");
  const html = page.locator("html");
  await expect(html).not.toHaveClass(/\bdark\b/);
  await page.getByRole("button", { name: "Passer en mode sombre" }).click();
  await expect(html).toHaveClass(/\bdark\b/);
  await page.reload();
  await expect(html).toHaveClass(/\bdark\b/);
  await page.getByRole("button", { name: "Passer en mode clair" }).click();
  await expect(html).not.toHaveClass(/\bdark\b/);
});

test("language switch applies and survives a reload", async ({ page }) => {
  await open(page, "/faq");
  await page.getByRole("radio", { name: "English" }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("radiogroup", { name: "Language" })).toBeVisible();
  await page.goto("/");
  await expect(page).toHaveTitle(/Tap water quality in France/);
  await page.getByRole("radio", { name: "Français" }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "fr");
});
