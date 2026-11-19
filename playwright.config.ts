import { defineConfig, devices } from "@playwright/test";

// Started by scripts/e2e.mjs (`pnpm test:e2e`), which builds the app and picks a free port.
const port = process.env.E2E_PORT;
if (!port) {
  throw new Error("E2E_PORT est requis : lancer les tests navigateur avec `pnpm test:e2e`.");
}
const origin = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  forbidOnly: Boolean(process.env.CI),
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: [["list"]],
  outputDir: process.env.E2E_OUTPUT_DIR || "test-results",
  use: {
    baseURL: origin,
    locale: "fr-FR",
    colorScheme: "light",
    trace: "off",
    screenshot: "off",
    video: "off",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // The production server as the image runs it (standalone output, NODE_ENV=production), without
  // a database: pages render without one, and the suite answers the data API calls itself.
  webServer: {
    command: "node server.js",
    cwd: ".next/standalone",
    url: `${origin}/api/ready`,
    env: { PORT: port, HOSTNAME: "127.0.0.1", NODE_ENV: "production" },
    reuseExistingServer: false,
    timeout: 60_000,
  },
});
