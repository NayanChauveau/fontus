import {
  createApplicationServices,
  type ApplicationServices,
} from "@/application/createApplicationServices";
import { initializeApplication } from "@/application/getApplication";
import type { ApplicationPorts } from "@/application/ports/ApplicationPorts";
import { createGeocodingModule } from "@/modules/geocoding";
import { createGeocodingPortAdapter } from "./adapters/createGeocodingPortAdapter";
import { createHealthPortAdapter } from "./adapters/createHealthPortAdapter";

function createApplicationPorts(): ApplicationPorts {
  return {
    geocoding: createGeocodingPortAdapter(createGeocodingModule()),
    health: createHealthPortAdapter(),
  };
}

export function createApp(): { application: ApplicationServices } {
  const ports = createApplicationPorts();
  const application = createApplicationServices(ports);
  initializeApplication(() => application);
  return { application };
}
