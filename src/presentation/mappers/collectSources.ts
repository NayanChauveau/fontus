import { fr } from "../i18n/fr";
import type {
  ComparisonViewModel,
  NetworkMeasurementViewModel,
  SourceRefViewModel,
} from "../view-models/NetworkAnalysesViewModel";

const HUBEAU_URL = "https://hubeau.eaufrance.fr/";

const JURISDICTIONS = [
  ["fr", fr.analyses.compareFr],
  ["eu", fr.analyses.compareEu],
  ["ch", fr.analyses.compareCh],
  ["us", fr.analyses.compareUs],
  ["strict", fr.analyses.compareStrict],
] as const;

export function collectSources(
  measurements: NetworkMeasurementViewModel[],
  measurementSourceLabel: string,
): SourceRefViewModel[] {
  const byId = new Map<string, SourceRefViewModel>();
  byId.set("measurement", {
    id: "measurement",
    label: measurementSourceLabel,
    href: HUBEAU_URL,
    kindLabel: fr.analyses.sourceMeasurements,
  });

  for (const measurement of measurements) {
    for (const [key, jurisdiction] of JURISDICTIONS) {
      addComparison(byId, measurement[key], jurisdiction);
    }
  }

  return [...byId.values()].sort(compareSources);
}

function addComparison(
  into: Map<string, SourceRefViewModel>,
  comparison: ComparisonViewModel | null,
  jurisdiction: string,
) {
  if (!comparison) {
    return;
  }
  const label = comparison.citation ?? fr.analyses.thresholdSource;
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

const KIND_ORDER: string[] = [
  fr.analyses.sourceMeasurements,
  fr.analyses.compareFr,
  fr.analyses.compareEu,
  fr.analyses.compareCh,
  fr.analyses.compareUs,
  fr.analyses.compareStrict,
];

function compareSources(left: SourceRefViewModel, right: SourceRefViewModel): number {
  const leftRank = kindRank(left.kindLabel);
  const rightRank = kindRank(right.kindLabel);
  if (leftRank !== rightRank) {
    return leftRank - rightRank;
  }
  return left.label.localeCompare(right.label, "fr");
}

function kindRank(kindLabel: string): number {
  const first = kindLabel.split(",")[0]!.trim();
  const index = KIND_ORDER.indexOf(first);
  return index === -1 ? KIND_ORDER.length : index;
}
