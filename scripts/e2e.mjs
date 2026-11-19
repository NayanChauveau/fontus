// Browser tests (tests/e2e) against the production build, run by `pnpm test:e2e` after `next build`.
// Lays out the standalone server like the Dockerfile (static files and public/ next to server.js),
// picks a free local port, then runs Playwright, which starts the server (playwright.config.ts)
// and stops it at the end. Extra arguments go to `playwright test`.
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, rmSync } from "node:fs";
import { createServer } from "node:net";

const standalone = ".next/standalone";
if (!existsSync(`${standalone}/server.js`)) {
  console.error("Pas de build standalone : lancer `pnpm test:e2e` (il construit l'application).");
  process.exit(1);
}
for (const [from, to] of [
  [".next/static", `${standalone}/.next/static`],
  ["public", `${standalone}/public`],
]) {
  rmSync(to, { recursive: true, force: true });
  cpSync(from, to, { recursive: true });
}

const port = await new Promise((resolve, reject) => {
  const server = createServer();
  server.once("error", reject);
  server.listen(0, "127.0.0.1", () => {
    const { port: free } = server.address();
    server.close(() => resolve(free));
  });
});

const result = spawnSync(
  process.execPath,
  ["node_modules/@playwright/test/cli.js", "test", ...process.argv.slice(2)],
  { stdio: "inherit", env: { ...process.env, E2E_PORT: String(port) } },
);
if (result.error) {
  console.error(result.error);
}
process.exit(result.status ?? 1);
