import type { GeocodingPort } from "./GeocodingPort";
import type { HealthPort } from "./HealthPort";
import type { NetworkPort } from "./NetworkPort";

export type ApplicationPorts = {
  geocoding: GeocodingPort;
  health: HealthPort;
  network: NetworkPort;
};
