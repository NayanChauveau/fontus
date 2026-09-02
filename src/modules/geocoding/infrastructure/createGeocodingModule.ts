import type { GeocodingModuleFacade } from "../application/public";
import { createGeoPfGeocodingGateway } from "./geoPf/createGeoPfGeocodingGateway";

export function createGeocodingModule(): GeocodingModuleFacade {
  return {
    gateway: createGeoPfGeocodingGateway(),
  };
}
