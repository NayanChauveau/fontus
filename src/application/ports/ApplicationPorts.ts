import type { GeocodingPort } from "./GeocodingPort";
import type { HealthPort } from "./HealthPort";

export type ApplicationPorts = {
  geocoding: GeocodingPort;
  health: HealthPort;
};
