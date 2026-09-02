import { sql } from "drizzle-orm";
import { getDb, type AppDatabase } from "@/shared/infrastructure/db/client";
import { rateBuckets } from "@/shared/infrastructure/db/schema";

export function createDrizzleRateLimiter(
  db: AppDatabase = getDb(),
  now: () => Date = () => new Date(),
) {
  return {
    async consume(input: { key: string; limit: number; windowMs: number }) {
      try {
        return await incrementBucket(db, now, input);
      } catch {
        // Missing table or Postgres blip must not take the product down.
        return true;
      }
    },
  };
}

async function incrementBucket(
  db: AppDatabase,
  now: () => Date,
  input: { key: string; limit: number; windowMs: number },
): Promise<boolean> {
  const current = now();
  const resetAt = new Date(current.getTime() + input.windowMs);
  const [row] = await db
    .insert(rateBuckets)
    .values({
      key: input.key,
      count: 1,
      resetAt,
    })
    .onConflictDoUpdate({
      target: rateBuckets.key,
      set: {
        count: sql`case when ${rateBuckets.resetAt} <= ${current} then 1 else ${rateBuckets.count} + 1 end`,
        resetAt: sql`case when ${rateBuckets.resetAt} <= ${current} then ${resetAt} else ${rateBuckets.resetAt} end`,
      },
    })
    .returning({ count: rateBuckets.count });

  return (row?.count ?? 1) <= input.limit;
}
