export function isInseeCitycode(value: string): boolean {
  return /^(?:\d{5}|2[AB]\d{3})$/i.test(value.trim());
}

export function normalizeCitycode(value: string): string {
  return value.trim().toUpperCase();
}
