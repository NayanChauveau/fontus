import type { CommuneNetworks } from "../../domain/DistributionNetwork";
import { groupUdiLinks } from "../../domain/groupUdiLinks";
import { narrowNetworksForAddress } from "../../domain/narrowNetworks";
import { isFreshEmptyYear, isFreshSync } from "../../domain/NetworkConfidence";
import { resolveCommuneInsee } from "../../domain/resolveCommuneInsee";
import { resolveNetworkConfidence } from "../../domain/resolveNetworkConfidence";
import type { CommunesUdiGatewayPort } from "../ports/CommunesUdiGatewayPort";
import type { NetworkCachePort } from "../ports/NetworkCachePort";

export type ListNetworksForCommuneResult = {
  commune: CommuneNetworks;
  confidence: ReturnType<typeof resolveNetworkConfidence>;
  source: "cache" | "remote";
};

export class ListNetworksForCommune {
  constructor(
    private readonly gateway: CommunesUdiGatewayPort,
    private readonly cache: NetworkCachePort,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(citycode: string): Promise<ListNetworksForCommuneResult> {
    const communeCode = resolveCommuneInsee(citycode);
    const now = this.now();
    const year = now.getUTCFullYear();

    const cachedCurrent = await this.readFresh(communeCode, year, now);
    if (cachedCurrent && cachedCurrent.links.length > 0) {
      return this.requireNetworks(cachedCurrent.links, "cache");
    }

    if (!cachedCurrent) {
      const remoteCurrent = await this.gateway.listByCommune(communeCode, year);
      await this.persist(communeCode, year, remoteCurrent, now);
      if (remoteCurrent.length > 0) {
        return this.requireNetworks(remoteCurrent, "remote");
      }
    }

    const previousYear = year - 1;
    const cachedPrevious = await this.readFresh(communeCode, previousYear, now);
    if (cachedPrevious && cachedPrevious.links.length > 0) {
      return this.requireNetworks(cachedPrevious.links, "cache");
    }

    const remotePrevious = await this.gateway.listByCommune(
      communeCode,
      previousYear,
    );
    if (remotePrevious.length > 0) {
      await this.persist(communeCode, previousYear, remotePrevious, now);
      return this.requireNetworks(remotePrevious, "remote");
    }

    throw new Error("NO_DISTRIBUTION_NETWORK");
  }

  private async readFresh(
    citycode: string,
    year: number,
    now: Date,
  ) {
    try {
      const cached = await this.cache.read(citycode, year);
      if (!cached) {
        return null;
      }
      if (cached.links.length === 0) {
        return isFreshEmptyYear(cached.fetchedAt, now) ? cached : null;
      }
      if (!isFreshSync(cached.fetchedAt, now)) {
        return null;
      }
      return cached;
    } catch {
      return null;
    }
  }

  private async persist(
    citycode: string,
    year: number,
    links: Awaited<ReturnType<CommunesUdiGatewayPort["listByCommune"]>>,
    fetchedAt: Date,
  ) {
    try {
      await this.cache.write({
        citycode,
        city: links[0]?.city ?? "",
        year,
        links,
        fetchedAt,
      });
    } catch {
      // Cache is an optimization; Hub’Eau results still go to the caller.
    }
  }

  private requireNetworks(
    links: Awaited<ReturnType<CommunesUdiGatewayPort["listByCommune"]>>,
    source: "cache" | "remote",
  ): ListNetworksForCommuneResult {
    const grouped = groupUdiLinks(links);
    if (!grouped || grouped.networks.length === 0) {
      throw new Error("NO_DISTRIBUTION_NETWORK");
    }

    const narrowed = narrowNetworksForAddress(grouped.networks);

    return {
      commune: {
        ...grouped,
        networks: narrowed.networks,
        hiddenNonResidentialCount: narrowed.hiddenCount,
      },
      confidence: resolveNetworkConfidence(narrowed.networks.length, {
        becameUniqueAfterFilter: narrowed.hiddenCount > 0,
      }),
      source,
    };
  }
}
