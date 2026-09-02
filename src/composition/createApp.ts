import {
  createApplicationServices,
  type ApplicationServices,
} from "@/application/createApplicationServices";
import { initializeApplication } from "@/application/getApplication";
import type { ApplicationPorts } from "@/application/ports/ApplicationPorts";
import { createAnalysesModule } from "@/modules/analyses";
import { createGeocodingModule } from "@/modules/geocoding";
import { createNetworkModule } from "@/modules/network";
import { createParametersModule } from "@/modules/parameters";
import { createAnalysesPortAdapter } from "./adapters/createAnalysesPortAdapter";
import { createGeocodingPortAdapter } from "./adapters/createGeocodingPortAdapter";
import { createHealthPortAdapter } from "./adapters/createHealthPortAdapter";
import { createNetworkPortAdapter } from "./adapters/createNetworkPortAdapter";
import { createParametersPortAdapter } from "./adapters/createParametersPortAdapter";

function createApplicationPorts(): ApplicationPorts {
  return {
    analyses: createAnalysesPortAdapter(createAnalysesModule()),
    geocoding: createGeocodingPortAdapter(createGeocodingModule()),
    health: createHealthPortAdapter(),
    network: createNetworkPortAdapter(createNetworkModule()),
    parameters: createParametersPortAdapter(createParametersModule()),
  };
}

export function createApp(): { application: ApplicationServices } {
  const ports = createApplicationPorts();
  const application = createApplicationServices(ports);
  initializeApplication(() => application);
  return { application };
}
