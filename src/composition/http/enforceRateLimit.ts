import { ApplicationError } from "@/application/errors/ApplicationError";
import { ensureApplication } from "@/composition/bootstrap";

const WINDOWS = {
  quality: { limit: 20, windowMs: 60_000 },
  suggest: { limit: 60, windowMs: 60_000 },
  errors: { limit: 10, windowMs: 60_000 },
} as const;

export async function enforceRateLimit(
  request: Request,
  bucket: keyof typeof WINDOWS,
) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const allowed = await ensureApplication().consumeRateLimit({
    key: `${bucket}:${ip}`,
    ...WINDOWS[bucket],
  });
  if (!allowed) {
    throw new ApplicationError("RATE_LIMITED");
  }
}

export function clientIpFrom(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
  );
}
