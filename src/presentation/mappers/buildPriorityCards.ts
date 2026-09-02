import { fr } from "../i18n/fr";
import type { Messages } from "../i18n/messages";
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

function cardTitle(id: PriorityCardId, messages: Messages): string {
  const titles: Record<PriorityCardId, string> = {
    pfas: messages.analyses.cardPfas,
    nitrates: messages.analyses.cardNitrates,
    pesticides: messages.analyses.cardPesticides,
    lead: messages.analyses.cardLead,
    arsenic: messages.analyses.cardArsenic,
    microbio: messages.analyses.cardMicrobio,
    hardness: messages.analyses.cardHardness,
  };
  return titles[id];
}

export function buildPriorityCards(
  measurements: NetworkMeasurementViewModel[],
  messages: Messages = fr,
  dateLocale = "fr",
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
    const rows = sortCardMeasurements(id, grouped.get(id) ?? [], dateLocale);
    return {
      id,
      title: cardTitle(id, messages),
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
  dateLocale: string,
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
    return left.parameterLabel.localeCompare(right.parameterLabel, dateLocale);
  });
}
