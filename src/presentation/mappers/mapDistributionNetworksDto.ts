import type { ListDistributionNetworksResultDto } from "@/application/dtos/DistributionNetworkDto";
import { fr } from "../i18n/fr";
import type { Messages } from "../i18n/messages";
import type { DistributionNetworksViewModel } from "../view-models/DistributionNetworkViewModel";

export function mapDistributionNetworksDto(
  dto: ListDistributionNetworksResultDto,
  messages: Messages = fr,
): DistributionNetworksViewModel {
  return {
    city: dto.city,
    year: dto.year,
    confidence: dto.confidence,
    confidenceLabel: confidenceLabel(dto.confidence, messages),
    disclaimer: disclaimer(dto.confidence, messages),
    hiddenNote:
      dto.hiddenNonResidentialCount > 0
        ? messages.networks.hiddenNonResidential.replace(
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
          : messages.networks.noNeighborhood,
    })),
  };
}

function confidenceLabel(
  confidence: ListDistributionNetworksResultDto["confidence"],
  messages: Messages,
): string {
  if (confidence === "exact") {
    return messages.networks.confidenceExact;
  }
  if (confidence === "ambiguous") {
    return messages.networks.confidenceAmbiguous;
  }
  return messages.networks.confidenceNone;
}

function disclaimer(
  confidence: ListDistributionNetworksResultDto["confidence"],
  messages: Messages,
): string {
  if (confidence === "exact") {
    return messages.networks.exactNote;
  }
  if (confidence === "ambiguous") {
    return messages.networks.ambiguousDisclaimer;
  }
  return messages.networks.noneNote;
}
