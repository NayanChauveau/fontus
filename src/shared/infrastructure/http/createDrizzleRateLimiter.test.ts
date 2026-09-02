import { describe, expect, it } from "vitest";
import { createFakeDb } from "@/test/fakeDb";
import { createDrizzleRateLimiter } from "./createDrizzleRateLimiter";

describe("createDrizzleRateLimiter", () => {
  it("allows traffic under the limit and rejects after reset window reuse", async () => {
    const now = new Date("2026-09-02T08:00:00.000Z");
    const limiter = createDrizzleRateLimiter(
      createFakeDb({
        selectResults: [
          [],
          [
            {
              key: "ip:quality",
              count: 20,
              resetAt: new Date("2026-09-02T09:00:00.000Z"),
            },
          ],
          [
            {
              key: "ip:quality",
              count: 1,
              resetAt: new Date("2026-09-02T07:00:00.000Z"),
            },
          ],
        ],
      }) as never,
      () => now,
    );

    expect(
      await limiter.consume({ key: "ip:quality", limit: 20, windowMs: 60_000 }),
    ).toBe(true);
    expect(
      await limiter.consume({ key: "ip:quality", limit: 20, windowMs: 60_000 }),
    ).toBe(false);
    expect(
      await limiter.consume({ key: "ip:quality", limit: 20, windowMs: 60_000 }),
    ).toBe(true);
  });

  it("fails open when Postgres cannot increment the bucket", async () => {
    const limiter = createDrizzleRateLimiter(
      {
        transaction: async () => {
          throw new Error("relation rate_buckets does not exist");
        },
      } as never,
    );
    expect(
      await limiter.consume({ key: "suggest:1", limit: 60, windowMs: 60_000 }),
    ).toBe(true);
  });
});
