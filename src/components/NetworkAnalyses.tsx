"use client";

import { useEffect, useState } from "react";
import type { NetworkWaterQualityDto } from "@/application/dtos/NetworkWaterQualityDto";
import { mapNetworkWaterQualityDto } from "@/presentation/mappers/mapNetworkWaterQualityDto";
import { fr } from "@/presentation/i18n/fr";
import type {
  ComparisonViewModel,
  NetworkAnalysesViewModel,
  NetworkMeasurementViewModel,
} from "@/presentation/view-models/NetworkAnalysesViewModel";

type LoadStatus = "loading" | "ready" | "unavailable";

export function NetworkAnalyses({ networkCode }: { networkCode: string }) {
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [viewModel, setViewModel] = useState<NetworkAnalysesViewModel | null>(
    null,
  );

  useEffect(() => {
    const controller = new AbortController();

    void (async () => {
      try {
        const response = await fetch(
          `/api/udi/${encodeURIComponent(networkCode)}/quality`,
          { signal: controller.signal },
        );
        const payload = (await response.json()) as
          | NetworkWaterQualityDto
          | { error: string };

        if (!response.ok || "error" in payload) {
          setStatus("unavailable");
          return;
        }

        setViewModel(mapNetworkWaterQualityDto(payload));
        setStatus("ready");
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        setStatus("unavailable");
      }
    })();

    return () => {
      controller.abort();
    };
  }, [networkCode]);

  return (
    <section
      aria-live="polite"
      className="rounded-xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
        {fr.analyses.title}
      </h3>

      {status === "loading" && (
        <p className="mt-3 text-sm text-zinc-500">{fr.analyses.loading}</p>
      )}

      {status === "unavailable" && (
        <p className="mt-3 text-sm text-red-700 dark:text-red-400">
          {fr.analyses.unavailable}
        </p>
      )}

      {status === "ready" && viewModel && (
        <AnalysesResults viewModel={viewModel} />
      )}
    </section>
  );
}

function AnalysesResults({
  viewModel,
}: {
  viewModel: NetworkAnalysesViewModel;
}) {
  const isEmpty =
    viewModel.priorityMeasurements.length === 0 &&
    viewModel.otherMeasurements.length === 0;

  return (
    <div className="mt-3 flex flex-col gap-4">
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-900 dark:bg-emerald-950/40">
        <p className="text-xs font-medium uppercase tracking-wide text-emerald-800 dark:text-emerald-300">
          {fr.analyses.conclusionTitle}
        </p>
        <p className="mt-1 text-sm font-medium text-zinc-950 dark:text-zinc-50">
          {viewModel.conclusion ?? fr.analyses.noConclusion}
        </p>
        <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
          {viewModel.officialNote}
        </p>
        {viewModel.sampledAtLabel && (
          <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
            {fr.analyses.sampledAt} {viewModel.sampledAtLabel}
          </p>
        )}
        <p className="mt-1 text-xs text-zinc-500">
          {fr.analyses.source} : {viewModel.sourceLabel}
        </p>
        <p className="mt-2 text-xs text-zinc-500">
          {viewModel.perParameterDateNote}
        </p>
      </div>

      {isEmpty ? (
        <p className="text-sm text-zinc-500">{fr.analyses.empty}</p>
      ) : (
        <>
          {viewModel.priorityMeasurements.length > 0 && (
            <MeasurementTable
              title={fr.analyses.priorityTitle}
              measurements={viewModel.priorityMeasurements}
            />
          )}
          {viewModel.otherMeasurements.length > 0 && (
            <MeasurementTable
              title={fr.analyses.otherTitle}
              measurements={viewModel.otherMeasurements}
            />
          )}
          {viewModel.reconstructedSumNote && (
            <p className="text-xs text-zinc-500">
              {viewModel.reconstructedSumNote}
            </p>
          )}
          <p className="text-xs text-zinc-500">{fr.analyses.noThresholdNote}</p>
          <p className="text-xs text-zinc-500">{fr.analyses.strictNote}</p>
        </>
      )}
    </div>
  );
}

function MeasurementTable({
  title,
  measurements,
}: {
  title: string;
  measurements: NetworkMeasurementViewModel[];
}) {
  return (
    <div>
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
        {title}
      </h4>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[56rem] text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-xs text-zinc-500 dark:border-zinc-800">
              <th className="py-2 pr-3 font-medium">{fr.analyses.parameter}</th>
              <th className="py-2 pr-3 font-medium">{fr.analyses.value}</th>
              <th className="py-2 pr-3 font-medium">{fr.analyses.compareFr}</th>
              <th className="py-2 pr-3 font-medium">{fr.analyses.compareEu}</th>
              <th className="py-2 pr-3 font-medium">{fr.analyses.compareCh}</th>
              <th className="py-2 pr-3 font-medium">{fr.analyses.compareUs}</th>
              <th
                className="py-2 pr-3 font-medium"
                title={fr.analyses.strictNote}
              >
                {fr.analyses.compareStrict}
              </th>
              <th className="py-2 pr-3 font-medium">{fr.analyses.date}</th>
              <th className="py-2 font-medium">{fr.analyses.source}</th>
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
                      {fr.analyses.dictionaryId} {measurement.canonicalId}
                    </p>
                  )}
                  {measurement.originalLabel && (
                    <p className="text-xs text-zinc-500">
                      {measurement.originalLabel}
                    </p>
                  )}
                </td>
                <td className="py-2 pr-3 font-mono text-zinc-800 dark:text-zinc-200">
                  <p>{measurement.valueLabel}</p>
                  {measurement.reconstructed && (
                    <p
                      className="font-sans text-[11px] text-zinc-500"
                      title={fr.analyses.reconstructedSumNote}
                    >
                      {fr.analyses.reconstructed}
                    </p>
                  )}
                </td>
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
                  {measurement.sampledAtLabel}
                </td>
                <td className="py-2 text-xs text-zinc-500">
                  {measurement.sourceLabel}
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
  if (!comparison || comparison.status === "no_threshold") {
    return (
      <span title={comparison?.citation ?? fr.analyses.noThreshold}>—</span>
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
