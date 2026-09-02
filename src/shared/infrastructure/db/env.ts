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
  try {
    const { hostname } = new URL(url);
    return hostname !== "localhost" && hostname !== "127.0.0.1";
  } catch {
    return !url.includes("localhost") && !url.includes("127.0.0.1");
  }
}
