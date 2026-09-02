import { fr } from "../i18n/fr";
import type { Messages } from "../i18n/messages";
import type { NetworkMeasurementViewModel } from "../view-models/NetworkAnalysesViewModel";

export const WATCH_PARAMETERS = [
  { id: "pfas20", name: "Somme PFAS-20", unit: "µg/L", category: "pfas" },
  { id: "pfoa", name: "PFOA", unit: "µg/L", category: "pfas" },
  { id: "pfos", name: "PFOS", unit: "µg/L", category: "pfas" },
  { id: "nitrates", name: "Nitrates", unit: "mg/L", category: "nutrients" },
  { id: "nitrites", name: "Nitrites", unit: "mg/L", category: "nutrients" },
  {
    id: "pesticides_total",
    name: "Pesticides (total analysé)",
    unit: "µg/L",
    category: "pesticides",
  },
  { id: "atrazine", name: "Atrazine", unit: "µg/L", category: "pesticides" },
  { id: "lead", name: "Plomb", unit: "µg/L", category: "metals" },
  { id: "arsenic", name: "Arsenic", unit: "µg/L", category: "metals" },
  {
    id: "ecoli",
    name: "Escherichia coli",
    unit: "n/(100mL)",
    category: "microbio",
  },
  {
    id: "enterococci",
    name: "Entérocoques",
    unit: "n/(100mL)",
    category: "microbio",
  },
  {
    id: "hardness",
    name: "Titre hydrotimétrique",
    unit: "°f",
    category: "organoleptic",
  },
] as const;

export function buildExhaustiveRows(
  measurements: NetworkMeasurementViewModel[],
  input: { networkCode: string; hasRecentSample: boolean },
  messages: Messages = fr,
): NetworkMeasurementViewModel[] {
  const byId = new Map<string, NetworkMeasurementViewModel>();
  for (const measurement of measurements) {
    if (measurement.canonicalId) {
      byId.set(measurement.canonicalId, measurement);
    }
  }

  const watchIds = new Set<string>(WATCH_PARAMETERS.map((row) => row.id));
  const watchRows = WATCH_PARAMETERS.map((parameter) => {
    return (
      byId.get(parameter.id) ??
      emptyWatchRow(parameter, input, messages)
    );
  });
  const rest = measurements.filter(
    (measurement) =>
      !measurement.canonicalId || !watchIds.has(measurement.canonicalId),
  );

  return [...watchRows, ...rest];
}

function emptyWatchRow(
  parameter: (typeof WATCH_PARAMETERS)[number],
  input: { networkCode: string; hasRecentSample: boolean },
  messages: Messages,
): NetworkMeasurementViewModel {
  const emptyKind = input.hasRecentSample ? "not_analysed" : "no_recent";
  return {
    parameterCode: `missing:${parameter.id}`,
    parameterLabel: parameter.name,
    canonicalName: parameter.name,
    canonicalId: parameter.id,
    category: parameter.category,
    originalLabel: null,
    valueLabel:
      emptyKind === "not_analysed"
        ? messages.analyses.notAnalysed
        : messages.analyses.noRecentAnalysis,
    canonicalValueLabel: null,
    converted: false,
    reconstructed: false,
    sampledAtLabel: "",
    sourceLabel: "",
    udiLabel: input.networkCode,
    unitLabel: parameter.unit,
    emptyKind,
    priority: true,
    fr: null,
    eu: null,
    ch: null,
    us: null,
    strict: null,
  };
}
