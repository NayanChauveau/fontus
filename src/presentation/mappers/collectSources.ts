import { fr } from "../i18n/fr";
import type { Messages } from "../i18n/messages";
import type {
  ComparisonViewModel,
  NetworkMeasurementViewModel,
  SourceRefViewModel,
} from "../view-models/NetworkAnalysesViewModel";

const HUBEAU_URL = "https://hubeau.eaufrance.fr/";

function jurisdictions(messages: Messages) {
  return [
    ["fr", messages.analyses.compareFr],
    ["eu", messages.analyses.compareEu],
    ["ch", messages.analyses.compareCh],
    ["us", messages.analyses.compareUs],
    ["strict", messages.analyses.compareStrict],
  ] as const;
}

function kindOrder(messages: Messages): string[] {
  return [
    messages.analyses.sourceMeasurements,
    messages.analyses.compareFr,
    messages.analyses.compareEu,
    messages.analyses.compareCh,
    messages.analyses.compareUs,
    messages.analyses.compareStrict,
  ];
}

export function collectSources(
  measurements: NetworkMeasurementViewModel[],
  measurementSourceLabel: string,
  messages: Messages = fr,
): SourceRefViewModel[] {
  const byId = new Map<string, SourceRefViewModel>();
  byId.set("measurement", {
    id: "measurement",
    label: measurementSourceLabel,
    href: HUBEAU_URL,
    kindLabel: messages.analyses.sourceMeasurements,
  });

  for (const measurement of measurements) {
    for (const [key, jurisdiction] of jurisdictions(messages)) {
      addComparison(byId, measurement[key], jurisdiction, messages);
    }
  }

  return [...byId.values()].sort((left, right) =>
    compareSources(left, right, messages),
  );
}

function addComparison(
  into: Map<string, SourceRefViewModel>,
  comparison: ComparisonViewModel | null,
  jurisdiction: string,
  messages: Messages,
) {
  if (!comparison) {
    return;
  }
  const label = comparison.citation ?? messages.analyses.thresholdSource;
  const href = comparison.sourceUrl;
  if (!comparison.citation && !href) {
    return;
  }

  const id = comparison.citation
    ? `cite:${normalizeCitation(comparison.citation)}`
    : `url:${href}`;
  const existing = into.get(id);
  if (existing) {
    if (!existing.kindLabel.includes(jurisdiction)) {
      existing.kindLabel = `${existing.kindLabel}, ${jurisdiction}`;
    }
    if (!existing.href && href) {
      existing.href = href;
    }
    return;
  }

  into.set(id, {
    id,
    label,
    href,
    kindLabel: jurisdiction,
  });
}

function normalizeCitation(citation: string): string {
  return citation.trim().replace(/\s+/g, " ");
}

function compareSources(
  left: SourceRefViewModel,
  right: SourceRefViewModel,
  messages: Messages,
): number {
  const leftRank = kindRank(left.kindLabel, messages);
  const rightRank = kindRank(right.kindLabel, messages);
  if (leftRank !== rightRank) {
    return leftRank - rightRank;
  }
  return left.label.localeCompare(right.label, "fr");
}

function kindRank(kindLabel: string, messages: Messages): number {
  const first = kindLabel.split(",")[0]!.trim();
  const index = kindOrder(messages).indexOf(first);
  return index === -1 ? kindOrder(messages).length : index;
}
