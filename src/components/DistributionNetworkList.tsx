"use client";

import { useEffect, useState } from "react";
import type { ListDistributionNetworksResultDto } from "@/application/dtos/DistributionNetworkDto";
import { mapDistributionNetworksDto } from "@/presentation/mappers/mapDistributionNetworksDto";
import { fr } from "@/presentation/i18n/fr";
import type {
  DistributionNetworksViewModel,
  DistributionNetworkViewModel,
} from "@/presentation/view-models/DistributionNetworkViewModel";

type LoadStatus = "loading" | "ready" | "unavailable";

export function DistributionNetworkList({ citycode }: { citycode: string }) {
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [viewModel, setViewModel] =
    useState<DistributionNetworksViewModel | null>(null);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    void (async () => {
      try {
        const response = await fetch(
          `/api/networks?citycode=${encodeURIComponent(citycode)}`,
          { signal: controller.signal },
        );
        const payload = (await response.json()) as
          | ListDistributionNetworksResultDto
          | { error: string };

        if (
          !response.ok ||
          "error" in payload ||
          payload.networks.length === 0
        ) {
          setStatus("unavailable");
          return;
        }

        const mapped = mapDistributionNetworksDto(payload);
        setViewModel(mapped);
        setSelectedCode(
          mapped.confidence === "exact" ? (mapped.networks[0]?.code ?? null) : null,
        );
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
  }, [citycode]);

  return (
    <section
      aria-live="polite"
      className="rounded-xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
        {fr.networks.title}
      </h3>

      {status === "loading" && (
        <p className="mt-3 text-sm text-zinc-500">{fr.networks.loading}</p>
      )}

      {status === "unavailable" && (
        <p className="mt-3 text-sm text-red-700 dark:text-red-400">
          {fr.networks.unavailable}
        </p>
      )}

      {status === "ready" && viewModel && (
        <NetworkResults
          viewModel={viewModel}
          selectedCode={selectedCode}
          onSelect={setSelectedCode}
          onClear={() => setSelectedCode(null)}
        />
      )}
    </section>
  );
}

function NetworkResults({
  viewModel,
  selectedCode,
  onSelect,
  onClear,
}: {
  viewModel: DistributionNetworksViewModel;
  selectedCode: string | null;
  onSelect: (code: string) => void;
  onClear: () => void;
}) {
  const needsChoice = viewModel.confidence === "ambiguous";
  const selected = viewModel.networks.find(
    (network) => network.code === selectedCode,
  );

  return (
    <div className="mt-3 flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
            viewModel.confidence === "exact"
              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
              : "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200"
          }`}
        >
          {viewModel.confidenceLabel}
        </span>
        {viewModel.year > 0 && (
          <span className="text-xs text-zinc-500">
            {fr.networks.year} {viewModel.year}
          </span>
        )}
      </div>

      <p className="text-sm text-zinc-700 dark:text-zinc-300">
        {viewModel.disclaimer}
      </p>
      {viewModel.hiddenNote && (
        <p className="text-xs text-zinc-500">{viewModel.hiddenNote}</p>
      )}

      {needsChoice && <HowToFindNetwork />}

      {needsChoice && selected && (
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
            {fr.networks.networkSelected}
          </p>
          <button
            type="button"
            onClick={onClear}
            className="text-sm text-emerald-700 underline-offset-2 hover:underline dark:text-emerald-400"
          >
            {fr.networks.changeNetwork}
          </button>
        </div>
      )}

      <ul className="flex flex-col gap-2">
        {viewModel.networks
          .filter((network) => !needsChoice || !selectedCode || network.code === selectedCode)
          .map((network) => (
            <li key={network.code}>
              {needsChoice ? (
                <NetworkChoice
                  network={network}
                  selected={network.code === selectedCode}
                  onSelect={() => onSelect(network.code)}
                />
              ) : (
                <NetworkCard network={network} />
              )}
            </li>
          ))}
      </ul>
    </div>
  );
}

function HowToFindNetwork() {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
      <p className="font-medium">{fr.networks.howToFindTitle}</p>
      <ol className="mt-2 list-decimal space-y-1.5 pl-5">
        <li>{fr.networks.howToFindBill}</li>
        <li>
          {fr.networks.howToFindMinistry}{" "}
          <a
            href={fr.networks.ministryUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium underline underline-offset-2"
          >
            {fr.networks.howToFindLink}
          </a>
        </li>
        <li>{fr.networks.howToFindThen}</li>
      </ol>
    </div>
  );
}

function NetworkChoice({
  network,
  selected,
  onSelect,
}: {
  network: DistributionNetworkViewModel;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`flex w-full flex-col items-start rounded-lg border px-4 py-3 text-left ${
        selected
          ? "border-emerald-600 bg-emerald-50 dark:border-emerald-500 dark:bg-emerald-950/40"
          : "border-zinc-200 bg-white hover:border-emerald-400 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-emerald-700"
      }`}
    >
      <span className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
        {network.name}
      </span>
      <span className="mt-1 text-xs text-zinc-500">
        {fr.networks.neighborhoods} : {network.neighborhoodsLabel}
      </span>
      <span className="mt-1 font-mono text-sm text-zinc-800 dark:text-zinc-200">
        {fr.networks.code} {network.code}
      </span>
      <span className="mt-2 text-xs font-medium text-emerald-700 dark:text-emerald-400">
        {selected ? fr.networks.networkSelected : fr.networks.chooseNetwork}
      </span>
    </button>
  );
}

function NetworkCard({ network }: { network: DistributionNetworkViewModel }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
      <p className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
        {network.name}
      </p>
      <p className="mt-1 text-xs text-zinc-500">
        {fr.networks.neighborhoods} : {network.neighborhoodsLabel}
      </p>
      <p className="mt-1 font-mono text-sm text-zinc-800 dark:text-zinc-200">
        {fr.networks.code} {network.code}
      </p>
    </div>
  );
}
