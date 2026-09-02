export type AddressCandidate = {
  sourceId: string;
  label: string;
  city: string;
  citycode: string;
  longitude: number;
  latitude: number;
};

export function isInseeCitycode(value: string): boolean {
  return /^(?:\d{5}|2[AB]\d{3})$/i.test(value);
}
