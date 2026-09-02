import type { GeocodingGatewayPort } from "./ports/GeocodingGatewayPort";

/** Surface interne exposée à la composition uniquement. */
export type GeocodingModuleFacade = {
  gateway: GeocodingGatewayPort;
};
