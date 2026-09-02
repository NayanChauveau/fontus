export function isNetworkCode(value: string): boolean {
  return /^\d{9}$/.test(value.trim());
}

export function normalizeNetworkCode(value: string): string {
  return value.trim();
}
