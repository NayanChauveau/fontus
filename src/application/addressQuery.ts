export const MIN_ADDRESS_QUERY_LENGTH = 3;
export const MAX_ADDRESS_QUERY_LENGTH = 200;

export function normalizeAddressQuery(raw: string): string {
  return raw.trim().replace(/\s+/g, " ").slice(0, MAX_ADDRESS_QUERY_LENGTH);
}

export function isAddressQueryTooShort(query: string): boolean {
  return normalizeAddressQuery(query).length < MIN_ADDRESS_QUERY_LENGTH;
}
