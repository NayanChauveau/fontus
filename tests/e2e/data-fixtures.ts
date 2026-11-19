import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { BrowserContext, Page } from "@playwright/test";

/**
 * The data API calls of the pages (Hub'Eau and the address API behind them, cached in Postgres),
 * answered from tests/e2e/fixtures, recorded from the real endpoints: the browser suites need
 * neither the network nor a database.
 */
// Playwright loads this file as CommonJS (the package is not "type": "module").
const fixture = (name: string) => readFileSync(join(__dirname, "fixtures", name), "utf8");

export const NETWORK_CODE = "075000221";

export async function answerDataApis(target: Page | BrowserContext) {
  await target.route("**/api/networks?*", (route) =>
    route.fulfill({ contentType: "application/json", body: fixture("networks-paris.json") }),
  );
  await target.route(`**/api/udi/${NETWORK_CODE}/quality*`, (route) =>
    route.fulfill({ contentType: "application/json", body: fixture("udi-quality.json") }),
  );
  await target.route("**/api/addresses/suggest?*", (route) =>
    route.fulfill({ contentType: "application/json", body: fixture("address-suggestions.json") }),
  );
}
