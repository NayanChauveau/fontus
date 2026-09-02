import type { RawUdiLink } from "../../domain/DistributionNetwork";

export type CommunesUdiGatewayPort = {
  listByCommune(citycode: string, year: number): Promise<RawUdiLink[]>;
};
