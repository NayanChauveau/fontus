import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

const dir = mkdtempSync(join(tmpdir(), "ready-"));
const flag = join(dir, "draining");

describe("GET /api/ready", () => {
  afterEach(() => rmSync(flag, { force: true }));

  it("answers 200 while the container takes traffic", async () => {
    const { readiness } = await import("./readiness");
    const response = readiness(flag);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "ready" });
  });

  it("answers 503 once the deploy marks the container as draining", async () => {
    writeFileSync(flag, "");
    const { readiness } = await import("./readiness");
    const response = readiness(flag);
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ status: "draining" });
  });
});
