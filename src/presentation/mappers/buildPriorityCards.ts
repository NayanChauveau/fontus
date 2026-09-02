import { fr } from "../i18n/fr";
import type {
  NetworkMeasurementViewModel,
  PriorityCardId,
  PriorityCardViewModel,
} from "../view-models/NetworkAnalysesViewModel";

const CARD_ORDER: PriorityCardId[] = [
  "pfas",
  "nitrates",
  "pesticides",
  "lead",
  "arsenic",
  "microbio",
  "hardness",
];

const HERO_IDS: Record<PriorityCardId, readonly string[]> = {
  pfas: ["pfas20", "pfoa", "pfos"],
  nitrates: ["nitrates", "nitrites"],
  pesticides: ["pesticides_total", "atrazine"],
  lead: ["lead"],
  arsenic: ["arsenic"],
  microbio: ["ecoli", "enterococci"],
  hardness: ["hardness"],
};

const CARD_TITLE: Record<PriorityCardId, string> = {
  pfas: fr.analyses.cardPfas,
  nitrates: fr.analyses.cardNitrates,
  pesticides: fr.analyses.cardPesticides,
  lead: fr.analyses.cardLead,
  arsenic: fr.analyses.cardArsenic,
  microbio: fr.analyses.cardMicrobio,
  hardness: fr.analyses.cardHardness,
};

export function buildPriorityCards(
  measurements: NetworkMeasurementViewModel[],
): PriorityCardViewModel[] {
  const grouped = new Map<PriorityCardId, NetworkMeasurementViewModel[]>();
  for (const id of CARD_ORDER) {
    grouped.set(id, []);
  }
  for (const measurement of measurements) {
    const cardId = cardIdFor(measurement);
    if (!cardId) {
      continue;
    }
    grouped.get(cardId)?.push(measurement);
  }

  return CARD_ORDER.map((id) => {
    const rows = sortCardMeasurements(id, grouped.get(id) ?? []);
    return {
      id,
      title: CARD_TITLE[id],
      empty: rows.length === 0,
      measurements: rows,
    };
  });
}

export function cardIdFor(
  measurement: Pick<NetworkMeasurementViewModel, "canonicalId" | "category">,
): PriorityCardId | null {
  if (measurement.canonicalId === "lead") {
    return "lead";
  }
  if (measurement.canonicalId === "arsenic") {
    return "arsenic";
  }
  if (measurement.canonicalId === "hardness") {
    return "hardness";
  }
  if (measurement.category === "pfas") {
    return "pfas";
  }
  if (measurement.category === "nutrients") {
    return "nitrates";
  }
  if (measurement.category === "pesticides") {
    return "pesticides";
  }
  if (measurement.category === "microbio") {
    return "microbio";
  }
  return null;
}

function sortCardMeasurements(
  cardId: PriorityCardId,
  measurements: NetworkMeasurementViewModel[],
): NetworkMeasurementViewModel[] {
  const order = HERO_IDS[cardId];
  return [...measurements].sort((left, right) => {
    const leftIndex = order.indexOf(left.canonicalId ?? "");
    const rightIndex = order.indexOf(right.canonicalId ?? "");
    const leftRank = leftIndex === -1 ? order.length : leftIndex;
    const rightRank = rightIndex === -1 ? order.length : rightIndex;
    if (leftRank !== rightRank) {
      return leftRank - rightRank;
    }
    return left.parameterLabel.localeCompare(right.parameterLabel, "fr");
  });
}
