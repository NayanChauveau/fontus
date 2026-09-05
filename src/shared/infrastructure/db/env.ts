export function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  return url;
}

const DEFAULT_POOL_MAX = 5;

export function getDatabasePoolMax(): number {
  const raw = process.env.DATABASE_POOL_MAX;
  if (!raw) {
    return DEFAULT_POOL_MAX;
  }
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_POOL_MAX;
}

export function shouldRequireDatabaseSsl(url: string): boolean {
  const forced = process.env.DATABASE_SSL;
  if (forced === "0" || forced === "false") {
    return false;
  }
  if (forced === "1" || forced === "true") {
    return true;
  }

  try {
    const { hostname } = new URL(url);
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return false;
    }
    // Docker Compose service names have no dot (e.g. postgres).
    return hostname.includes(".");
  } catch {
    return !url.includes("localhost") && !url.includes("127.0.0.1");
  }
}
