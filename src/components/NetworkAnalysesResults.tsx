"use client";

import { useMessages } from "@/presentation/i18n/useLocale";
import type {
  ComparisonViewModel,
  NetworkAnalysesViewModel,
  NetworkMeasurementViewModel,
  ParameterHistoryViewModel,
  PriorityCardViewModel,
  SourceRefViewModel,
} from "@/presentation/view-models/NetworkAnalysesViewModel";

export function NetworkAnalysesResults({
  viewModel,
}: {
  viewModel: NetworkAnalysesViewModel;
}) {
  const messages = useMessages();
  const isEmpty =
    viewModel.priorityMeasurements.length === 0 &&
    viewModel.otherMeasurements.length === 0;

  return (
    <div className="mt-3 flex flex-col gap-4">
      <OfficialBanner viewModel={viewModel} />

      {viewModel.comparisonFailed && (
        <p className="text-sm text-amber-800 dark:text-amber-300">
          {messages.analyses.compareFailed}
        </p>
      )}

      {isEmpty && (
        <p className="text-sm text-zinc-500">{messages.analyses.empty}</p>
      )}

      <section>
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          {messages.analyses.cardsTitle}
        </h4>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {viewModel.priorityCards.map((card) => (
            <PriorityCard key={card.id} card={card} />
          ))}
        </div>
      </section>

      {viewModel.parameterHistories.length > 0 && (
        <HistorySection
          histories={viewModel.parameterHistories}
          windowFromLabel={viewModel.windowFromLabel}
        />
      )}

      {!viewModel.comparisonFailed && viewModel.priorityMeasurements.length > 0 && (
        <MeasurementTable
          title={messages.analyses.comparisonTitle}
          measurements={viewModel.priorityMeasurements}
        />
      )}

      {!viewModel.comparisonFailed && (
        <MeasurementTable
          title={messages.analyses.allAnalysesTitle}
          measurements={viewModel.exhaustiveMeasurements}
          provenance
        />
      )}

      {viewModel.reconstructedSumNote && (
        <p className="text-xs text-zinc-500">
          {viewModel.reconstructedSumNote}
        </p>
      )}
      <p className="text-xs text-zinc-500">{messages.analyses.noThresholdNote}</p>
      <p className="text-xs text-zinc-500">{messages.analyses.strictNote}</p>
      <p className="text-xs text-zinc-500">{viewModel.disclaimer}</p>
      <SourcesList sources={viewModel.sources} />
    </div>
  );
}

function OfficialBanner({
  viewModel,
}: {
  viewModel: NetworkAnalysesViewModel;
}) {
  const messages = useMessages();
  const tone =
    viewModel.bannerTone === "alert"
      ? "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/40"
      : viewModel.bannerTone === "ok"
        ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/40"
        : "border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950/40";
  const kicker =
    viewModel.bannerTone === "alert"
      ? "text-red-800 dark:text-red-300"
      : viewModel.bannerTone === "ok"
        ? "text-emerald-800 dark:text-emerald-300"
        : "text-zinc-600 dark:text-zinc-400";

  return (
    <div className={`rounded-lg border px-4 py-3 ${tone}`}>
      <p className={`text-xs font-medium uppercase tracking-wide ${kicker}`}>
        {messages.analyses.conclusionTitle}
      </p>
      <p className="mt-1 text-sm font-medium text-zinc-950 dark:text-zinc-50">
        {viewModel.conclusion ?? messages.analyses.noConclusion}
      </p>
      {viewModel.limitesBactLabel && (
        <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
          {messages.analyses.limitesBact} : {viewModel.limitesBactLabel}
        </p>
      )}
      {viewModel.limitesPcLabel && (
        <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
          {messages.analyses.limitesPc} : {viewModel.limitesPcLabel}
        </p>
      )}
      <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
        {viewModel.officialNote}
      </p>
      {viewModel.sampledAtLabel && (
        <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
          {messages.analyses.sampledAt} {viewModel.sampledAtLabel}
        </p>
      )}
      <p className="mt-1 text-xs text-zinc-500">
        {messages.analyses.source} : {viewModel.sourceLabel}
      </p>
      <p className="mt-2 text-xs text-zinc-500">
        {viewModel.perParameterDateNote}
      </p>
      <p className="mt-2 text-xs text-zinc-500">{viewModel.cardsCampaignNote}</p>
    </div>
  );
}

function PriorityCard({ card }: { card: PriorityCardViewModel }) {
  const messages = useMessages();
  const hero = card.measurements[0];
  const rest = card.measurements.slice(1);

  return (
    <article className="rounded-lg border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
      <h5 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
        {card.title}
      </h5>
      {!hero ? (
        <p className="mt-2 text-sm text-zinc-500">{messages.analyses.cardEmpty}</p>
      ) : (
        <>
          <p className="mt-2 text-sm font-medium text-zinc-950 dark:text-zinc-50">
            {hero.parameterLabel}
          </p>
          <p className="mt-1 font-mono text-sm text-zinc-800 dark:text-zinc-200">
            {hero.valueLabel}
          </p>
          {hero.reconstructed && (
            <p className="text-[11px] text-zinc-500">{messages.analyses.reconstructed}</p>
          )}
          <div className="mt-2 text-xs">
            <ComparisonCell comparison={hero.fr} />
          </div>
          {hero.sampledAtLabel && (
            <p className="mt-2 text-[11px] text-zinc-500">
              {messages.analyses.sampledAt} {hero.sampledAtLabel}
            </p>
          )}
          {rest.map((measurement) => (
            <p
              key={measurement.parameterCode}
              className="mt-2 text-xs text-zinc-600 dark:text-zinc-400"
            >
              {measurement.parameterLabel}
              {" · "}
              <span className="font-mono">{measurement.valueLabel}</span>
            </p>
          ))}
        </>
      )}
    </article>
  );
}

function HistorySection({
  histories,
  windowFromLabel,
}: {
  histories: ParameterHistoryViewModel[];
  windowFromLabel: string | null;
}) {
  const messages = useMessages();
  return (
    <section>
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
        {messages.analyses.historyTitle}
      </h4>
      {windowFromLabel && (
        <p className="mb-3 text-xs text-zinc-500">
          {messages.analyses.historyWindow} {windowFromLabel}
        </p>
      )}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        {histories.map((history) => (
          <article
            key={history.canonicalId}
            className="rounded-lg border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950"
          >
            <h5 className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
              {history.title}
            </h5>
            <p className="mt-1 text-xs text-zinc-500">{history.statsLabel}</p>
            <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
              {history.trendLabel}
            </p>
            {history.warningLabels.map((warning) => (
              <p key={warning} className="mt-1 text-xs text-amber-800 dark:text-amber-300">
                {warning}
              </p>
            ))}
            <HistorySparkline history={history} />
            <ol className="mt-3 max-h-40 space-y-1 overflow-auto text-xs text-zinc-600 dark:text-zinc-400">
              {history.points.map((point, index) => (
                <li key={`${history.canonicalId}-${index}`}>
                  <span className="text-zinc-500">{point.sampledAtLabel}</span>
                  {" · "}
                  <span className="font-mono">{point.valueLabel}</span>
                </li>
              ))}
            </ol>
          </article>
        ))}
      </div>
    </section>
  );
}

function HistorySparkline({
  history,
}: {
  history: ParameterHistoryViewModel;
}) {
  const messages = useMessages();
  const values = history.points
    .map((point) => point.y)
    .filter((value): value is number => value !== null && Number.isFinite(value));
  if (values.length < 2) {
    return null;
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const width = 240;
  const height = 56;
  const pad = 4;
  const coords = values.map((value, index) => {
    const x = pad + (index / (values.length - 1)) * (width - pad * 2);
    const y = height - pad - ((value - min) / span) * (height - pad * 2);
    return `${x},${y}`;
  });

  return (
    <svg
      role="img"
      aria-label={`${messages.analyses.historyChart} ${history.title}`}
      viewBox={`0 0 ${width} ${height}`}
      className="mt-3 h-14 w-full text-emerald-700 dark:text-emerald-400"
    >
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
        points={coords.join(" ")}
      />
    </svg>
  );
}

function MeasurementTable({
  title,
  measurements,
  provenance = false,
}: {
  title: string;
  measurements: NetworkMeasurementViewModel[];
  provenance?: boolean;
}) {
  const messages = useMessages();
  return (
    <div>
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
        {title}
      </h4>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[56rem] text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-xs text-zinc-500 dark:border-zinc-800">
              <th className="py-2 pr-3 font-medium">{messages.analyses.parameter}</th>
              <th className="py-2 pr-3 font-medium">{messages.analyses.value}</th>
              {provenance && (
                <th className="py-2 pr-3 font-medium">{messages.analyses.unit}</th>
              )}
              <th className="py-2 pr-3 font-medium">{messages.analyses.compareFr}</th>
              <th className="py-2 pr-3 font-medium">{messages.analyses.compareEu}</th>
              <th className="py-2 pr-3 font-medium">{messages.analyses.compareCh}</th>
              <th className="py-2 pr-3 font-medium">{messages.analyses.compareUs}</th>
              <th
                className="py-2 pr-3 font-medium"
                title={messages.analyses.strictNote}
              >
                {messages.analyses.compareStrict}
              </th>
              <th className="py-2 pr-3 font-medium">{messages.analyses.date}</th>
              {provenance && (
                <th className="py-2 pr-3 font-medium">{messages.analyses.udi}</th>
              )}
              <th className="py-2 font-medium">{messages.analyses.source}</th>
            </tr>
          </thead>
          <tbody>
            {measurements.map((measurement) => (
              <tr
                key={measurement.parameterCode}
                className="border-b border-zinc-100 last:border-0 dark:border-zinc-800"
              >
                <td className="py-2 pr-3 text-zinc-950 dark:text-zinc-50">
                  <p>{measurement.parameterLabel}</p>
                  {measurement.canonicalId && (
                    <p className="font-mono text-xs text-zinc-500">
                      {messages.analyses.dictionaryId} {measurement.canonicalId}
                    </p>
                  )}
                  {measurement.originalLabel && (
                    <p className="text-xs text-zinc-500">
                      {measurement.originalLabel}
                    </p>
                  )}
                </td>
                <td className="py-2 pr-3 font-mono text-zinc-800 dark:text-zinc-200">
                  <p
                    className={
                      measurement.emptyKind
                        ? "font-sans text-zinc-500"
                        : undefined
                    }
                  >
                    {measurement.valueLabel}
                  </p>
                  {measurement.reconstructed && (
                    <p
                      className="font-sans text-[11px] text-zinc-500"
                      title={messages.analyses.reconstructedSumNote}
                    >
                      {messages.analyses.reconstructed}
                    </p>
                  )}
                </td>
                {provenance && (
                  <td className="py-2 pr-3 font-mono text-xs text-zinc-500">
                    {measurement.unitLabel ?? "—"}
                  </td>
                )}
                <td className="py-2 pr-3 text-xs text-zinc-600 dark:text-zinc-400">
                  <ComparisonCell comparison={measurement.fr} />
                </td>
                <td className="py-2 pr-3 text-xs text-zinc-600 dark:text-zinc-400">
                  <ComparisonCell comparison={measurement.eu} />
                </td>
                <td className="py-2 pr-3 text-xs text-zinc-600 dark:text-zinc-400">
                  <ComparisonCell comparison={measurement.ch} />
                </td>
                <td className="py-2 pr-3 text-xs text-zinc-600 dark:text-zinc-400">
                  <ComparisonCell comparison={measurement.us} />
                </td>
                <td className="py-2 pr-3 text-xs text-zinc-600 dark:text-zinc-400">
                  <ComparisonCell comparison={measurement.strict} />
                </td>
                <td className="py-2 pr-3 text-xs text-zinc-500">
                  {measurement.sampledAtLabel || "—"}
                </td>
                {provenance && (
                  <td className="py-2 pr-3 font-mono text-xs text-zinc-500">
                    {measurement.udiLabel}
                  </td>
                )}
                <td className="py-2 text-xs text-zinc-500">
                  {measurement.sourceLabel || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ComparisonCell({
  comparison,
}: {
  comparison: ComparisonViewModel | null;
}) {
  const messages = useMessages();
  if (!comparison || comparison.status === "no_threshold") {
    return (
      <span title={comparison?.citation ?? messages.analyses.noThreshold}>—</span>
    );
  }

  return (
    <div title={comparison.citation ?? undefined}>
      <p
        className={
          comparison.siteMetric
            ? comparison.status === "exceedance"
              ? "font-medium text-amber-800 dark:text-amber-300"
              : "text-zinc-700 dark:text-zinc-300"
            : comparison.status === "exceedance"
              ? "font-medium text-red-700 dark:text-red-400"
              : comparison.status === "compliant"
                ? "font-medium text-emerald-700 dark:text-emerald-400"
                : "text-zinc-600 dark:text-zinc-400"
        }
      >
        {comparison.statusLabel}
      </p>
      {comparison.thresholdLabel && (
        <p className="font-mono text-[11px] text-zinc-500">
          {comparison.thresholdLabel}
        </p>
      )}
      {comparison.kindLabel && (
        <p className="text-[11px] text-zinc-500">{comparison.kindLabel}</p>
      )}
    </div>
  );
}

function SourcesList({ sources }: { sources: SourceRefViewModel[] }) {
  const messages = useMessages();
  return (
    <section>
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
        {messages.analyses.sourcesTitle}
      </h4>
      <ul className="space-y-1 text-xs text-zinc-600 dark:text-zinc-400">
        {sources.map((source) => (
          <li key={source.id}>
            <span className="text-zinc-500">{source.kindLabel}</span>
            {" · "}
            {source.href ? (
              <a
                href={source.href}
                target="_blank"
                rel="noreferrer"
                className="text-emerald-800 underline decoration-emerald-800/40 underline-offset-2 dark:text-emerald-300"
              >
                {source.label}
              </a>
            ) : (
              source.label
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
