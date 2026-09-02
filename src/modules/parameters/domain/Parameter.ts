export type ParameterCategory =
  | "pfas"
  | "nutrients"
  | "metals"
  | "microbio"
  | "pesticides"
  | "organoleptic"
  | "unlisted";

export type ParameterOrigin = "seed" | "import";

export type AliasSource = "sandre" | "sise" | "cas";

export type ParameterAlias = {
  source: AliasSource;
  externalCode: string;
  label: string | null;
};

export type CanonicalParameter = {
  id: string;
  name: string;
  cas: string | null;
  category: ParameterCategory;
  canonicalUnit: string | null;
  displayPriority: number;
  origin: ParameterOrigin;
  aliases: ParameterAlias[];
};

export const UNLISTED_PRIORITY = 1000;

export function unlistedParameterId(code: string): string {
  return `unlisted:${code}`;
}
