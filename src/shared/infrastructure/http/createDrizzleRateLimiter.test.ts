import { describe, expect, it } from "vitest";
import { createFakeDb } from "@/test/fakeDb";
import { createDrizzleRateLimiter } from "./createDrizzleRateLimiter";

describe("createDrizzleRateLimiter", () => {
  it("allows traffic under the limit and rejects after reset window reuse", async () => {
    const now = new Date("2026-09-02T08:00:00.000Z");
    const limiter = createDrizzleRateLimiter(
      createFakeDb({
        selectResults: [[{ count: 1 }], [{ count: 21 }], [{ count: 1 }]],
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

  it("treats a missing returning row as the first hit", async () => {
    const limiter = createDrizzleRateLimiter(
      createFakeDb({ selectResults: [[]] }) as never,
    );
    expect(
      await limiter.consume({ key: "ip:quality", limit: 20, windowMs: 60_000 }),
    ).toBe(true);
  });

  it("fails open when Postgres cannot increment the bucket", async () => {
    const limiter = createDrizzleRateLimiter(
      {
        insert: () => {
          throw new Error("relation rate_buckets does not exist");
        },
      } as never,
    );
    expect(
      await limiter.consume({ key: "suggest:1", limit: 60, windowMs: 60_000 }),
    ).toBe(true);
  });
});
