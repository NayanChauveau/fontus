import type { AnalysesPort } from "./AnalysesPort";
import type { GeocodingPort } from "./GeocodingPort";
import type { HealthPort } from "./HealthPort";
import type { NetworkPort } from "./NetworkPort";

export type ApplicationPorts = {
  analyses: AnalysesPort;
  geocoding: GeocodingPort;
  health: HealthPort;
  network: NetworkPort;
};
