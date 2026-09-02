import type { GeocodingModuleFacade } from "../application/public";
import { ResolveAddress } from "../application/use-cases/ResolveAddress";
import { SuggestAddresses } from "../application/use-cases/SuggestAddresses";
import { createGeoPfGeocodingGateway } from "./geoPf/createGeoPfGeocodingGateway";

export function createGeocodingModule(): GeocodingModuleFacade {
  const gateway = createGeoPfGeocodingGateway();
  return {
    suggestAddresses: new SuggestAddresses(gateway),
    resolveAddress: new ResolveAddress(gateway),
  };
}
