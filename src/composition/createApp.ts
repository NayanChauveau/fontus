import {
  createApplicationServices,
  type ApplicationServices,
} from "@/application/createApplicationServices";
import { initializeApplication } from "@/application/getApplication";
import type { ApplicationPorts } from "@/application/ports/ApplicationPorts";
import { createGeocodingModule } from "@/modules/geocoding";
import { createNetworkModule } from "@/modules/network";
import { createGeocodingPortAdapter } from "./adapters/createGeocodingPortAdapter";
import { createHealthPortAdapter } from "./adapters/createHealthPortAdapter";
import { createNetworkPortAdapter } from "./adapters/createNetworkPortAdapter";

function createApplicationPorts(): ApplicationPorts {
  return {
    geocoding: createGeocodingPortAdapter(createGeocodingModule()),
    health: createHealthPortAdapter(),
    network: createNetworkPortAdapter(createNetworkModule()),
  };
}

export function createApp(): { application: ApplicationServices } {
  const ports = createApplicationPorts();
  const application = createApplicationServices(ports);
  initializeApplication(() => application);
  return { application };
}
