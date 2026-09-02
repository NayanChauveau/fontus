import type { ResolveAddress } from "./use-cases/ResolveAddress";
import type { SuggestAddresses } from "./use-cases/SuggestAddresses";

/** Surface interne exposée à la composition uniquement. */
export type GeocodingModuleFacade = {
  suggestAddresses: SuggestAddresses;
  resolveAddress: ResolveAddress;
};
