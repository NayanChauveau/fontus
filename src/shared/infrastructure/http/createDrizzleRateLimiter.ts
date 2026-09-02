import { eq } from "drizzle-orm";
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
  return db.transaction(async (tx) => {
    const [row] = await tx
      .select()
      .from(rateBuckets)
      .where(eq(rateBuckets.key, input.key))
      .limit(1);

    const expired = !row || row.resetAt.getTime() <= current.getTime();
    const nextCount = expired ? 1 : row.count + 1;
    const resetAt = expired
      ? new Date(current.getTime() + input.windowMs)
      : row.resetAt;

    await tx
      .insert(rateBuckets)
      .values({
        key: input.key,
        count: nextCount,
        resetAt,
      })
      .onConflictDoUpdate({
        target: rateBuckets.key,
        set: { count: nextCount, resetAt },
      });

    return nextCount <= input.limit;
  });
}
