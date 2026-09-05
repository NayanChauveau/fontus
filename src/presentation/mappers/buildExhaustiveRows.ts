import { fr } from "../i18n/fr";
import type { Messages } from "../i18n/messages";
import type { NetworkMeasurementViewModel } from "../view-models/NetworkAnalysesViewModel";

export const WATCH_PARAMETERS = [
  { id: "pfas20", nameKey: "watchPfas20", unit: "µg/L", category: "pfas" },
  { id: "pfoa", nameKey: "watchPfoa", unit: "µg/L", category: "pfas" },
  { id: "pfos", nameKey: "watchPfos", unit: "µg/L", category: "pfas" },
  { id: "nitrates", nameKey: "watchNitrates", unit: "mg/L", category: "nutrients" },
  { id: "nitrites", nameKey: "watchNitrites", unit: "mg/L", category: "nutrients" },
  {
    id: "pesticides_total",
    nameKey: "watchPesticidesTotal",
    unit: "µg/L",
    category: "pesticides",
  },
  { id: "atrazine", nameKey: "watchAtrazine", unit: "µg/L", category: "pesticides" },
  { id: "lead", nameKey: "watchLead", unit: "µg/L", category: "metals" },
  { id: "arsenic", nameKey: "watchArsenic", unit: "µg/L", category: "metals" },
  {
    id: "ecoli",
    nameKey: "watchEcoli",
    unit: "n/(100mL)",
    category: "microbio",
  },
  {
    id: "enterococci",
    nameKey: "watchEnterococci",
    unit: "n/(100mL)",
    category: "microbio",
  },
  {
    id: "hardness",
    nameKey: "watchHardness",
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
  const name = messages.analyses[parameter.nameKey];
  return {
    parameterCode: `missing:${parameter.id}`,
    parameterLabel: name,
    canonicalName: name,
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
    who: null,
    strict: null,
  };
}
