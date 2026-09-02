import {
  createApplicationServices,
  type ApplicationServices,
} from "@/application/createApplicationServices";
import { initializeApplication } from "@/application/getApplication";
import type { ApplicationPorts } from "@/application/ports/ApplicationPorts";
import { createAnalysesModule } from "@/modules/analyses";
import { createComparisonModule } from "@/modules/comparison";
import { createGeocodingModule } from "@/modules/geocoding";
import { createNetworkModule } from "@/modules/network";
import { createNormsModule } from "@/modules/norms";
import { createParametersModule } from "@/modules/parameters";
import { createAnalysesPortAdapter } from "./adapters/createAnalysesPortAdapter";
import { createComparisonPortAdapter } from "./adapters/createComparisonPortAdapter";
import { createGeocodingPortAdapter } from "./adapters/createGeocodingPortAdapter";
import { createHealthPortAdapter } from "./adapters/createHealthPortAdapter";
import { createNetworkPortAdapter } from "./adapters/createNetworkPortAdapter";
import { createParametersPortAdapter } from "./adapters/createParametersPortAdapter";

function createApplicationPorts(): ApplicationPorts {
  const norms = createNormsModule();
  return {
    analyses: createAnalysesPortAdapter(createAnalysesModule()),
    comparison: createComparisonPortAdapter(createComparisonModule(norms)),
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
