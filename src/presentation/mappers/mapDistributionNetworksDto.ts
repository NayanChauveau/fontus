import type { ListDistributionNetworksResultDto } from "@/application/dtos/DistributionNetworkDto";
import { fr } from "../i18n/fr";
import type { DistributionNetworksViewModel } from "../view-models/DistributionNetworkViewModel";

export function mapDistributionNetworksDto(
  dto: ListDistributionNetworksResultDto,
): DistributionNetworksViewModel {
  return {
    city: dto.city,
    year: dto.year,
    confidence: dto.confidence,
    confidenceLabel: confidenceLabel(dto.confidence),
    disclaimer: disclaimer(dto.confidence),
    hiddenNote:
      dto.hiddenNonResidentialCount > 0
        ? fr.networks.hiddenNonResidential.replace(
            "{{count}}",
            String(dto.hiddenNonResidentialCount),
          )
        : null,
    selectedNetworkCode: null,
    networks: dto.networks.map((network) => ({
      code: network.code,
      name: network.name,
      neighborhoodsLabel:
        network.neighborhoods.length > 0
          ? network.neighborhoods.join(" · ")
          : fr.networks.noNeighborhood,
    })),
  };
}

function confidenceLabel(
  confidence: ListDistributionNetworksResultDto["confidence"],
): string {
  if (confidence === "exact") {
    return fr.networks.confidenceExact;
  }
  if (confidence === "ambiguous") {
    return fr.networks.confidenceAmbiguous;
  }
  return fr.networks.confidenceNone;
}

function disclaimer(
  confidence: ListDistributionNetworksResultDto["confidence"],
): string {
  if (confidence === "exact") {
    return fr.networks.exactNote;
  }
  if (confidence === "ambiguous") {
    return fr.networks.ambiguousDisclaimer;
  }
  return fr.networks.noneNote;
}
