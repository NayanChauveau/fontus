"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ListDistributionNetworksResultDto } from "@/application/dtos/DistributionNetworkDto";
import { LoadingStatus } from "@/components/LoadingStatus";
import { NetworkAnalyses } from "@/components/NetworkAnalyses";
import { mapDistributionNetworksDto } from "@/presentation/mappers/mapDistributionNetworksDto";
import { useMessages } from "@/presentation/i18n/useLocale";
import type {
  DistributionNetworksViewModel,
  DistributionNetworkViewModel,
} from "@/presentation/view-models/DistributionNetworkViewModel";

type LoadStatus = "loading" | "ready" | "unavailable";

export function DistributionNetworkList({
  citycode,
  selectedCode: selectedCodeProp,
  onSelectedCodeChange,
  onCommuneLoaded,
}: {
  citycode: string;
  selectedCode?: string | null;
  onSelectedCodeChange?: (code: string | null) => void;
  onCommuneLoaded?: (city: string) => void;
}) {
  const messages = useMessages();
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [dto, setDto] = useState<ListDistributionNetworksResultDto | null>(
    null,
  );
  const viewModel = useMemo(
    () => (dto ? mapDistributionNetworksDto(dto, messages) : null),
    [dto, messages],
  );
  const [internalCode, setInternalCode] = useState<string | null>(null);
  const controlled = onSelectedCodeChange !== undefined;
  const selectedCode = controlled ? (selectedCodeProp ?? null) : internalCode;
  const selectedCodeRef = useRef(selectedCode);
  const onSelectedCodeChangeRef = useRef(onSelectedCodeChange);
  const onCommuneLoadedRef = useRef(onCommuneLoaded);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    selectedCodeRef.current = selectedCode;
    onSelectedCodeChangeRef.current = onSelectedCodeChange;
    onCommuneLoadedRef.current = onCommuneLoaded;
  });

  const setSelectedCode = useCallback(
    (code: string | null) => {
      if (!controlled) {
        setInternalCode(code);
      }
      onSelectedCodeChangeRef.current?.(code);
    },
    [controlled],
  );

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

        setDto(payload);
        onCommuneLoadedRef.current?.(payload.city);
        const codes = payload.networks
          .map((network) => network.code)
          .filter((code): code is string => Boolean(code));
        const current = selectedCodeRef.current;
        const requested =
          current && codes.includes(current) ? current : null;
        const next =
          requested ??
          (codes.length === 1 || payload.confidence === "exact"
            ? (codes[0] ?? null)
            : null);
        if (next !== current) {
          setSelectedCode(next);
        }
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
  }, [citycode, reloadToken, setSelectedCode]);

  return (
    <>
      <section
        aria-busy={status === "loading"}
        aria-live="polite"
        className="rounded-xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-900"
      >
        <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
          {messages.networks.title}
        </h3>

        {status === "loading" && (
          <LoadingStatus label={messages.networks.loading} />
        )}

        {status === "unavailable" && (
          <div className="mt-3 flex flex-col items-start gap-2">
            <p className="text-sm text-red-700 dark:text-red-400">
              {messages.networks.unavailable}
            </p>
            <button
              type="button"
              onClick={() => {
                setStatus("loading");
                setReloadToken((current) => current + 1);
              }}
              className="text-sm text-emerald-700 underline-offset-2 hover:underline dark:text-emerald-400"
            >
              {messages.errors.retry}
            </button>
          </div>
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

      {status === "ready" && selectedCode && (
        <NetworkAnalyses key={selectedCode} networkCode={selectedCode} />
      )}
    </>
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
  const messages = useMessages();
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
            {messages.networks.year} {viewModel.year}
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
            {messages.networks.networkSelected}
          </p>
          <button
            type="button"
            onClick={onClear}
            className="text-sm text-emerald-700 underline-offset-2 hover:underline dark:text-emerald-400"
          >
            {messages.networks.changeNetwork}
          </button>
        </div>
      )}

      <ul className="flex flex-col gap-2">
        {viewModel.networks.map((network) => (
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
  const messages = useMessages();
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
      <p className="font-medium">{messages.networks.howToFindTitle}</p>
      <ol className="mt-2 list-decimal space-y-1.5 pl-5">
        <li>{messages.networks.howToFindBill}</li>
        <li>
          {messages.networks.howToFindMinistry}{" "}
          <a
            href={messages.networks.ministryUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium underline underline-offset-2"
          >
            {messages.networks.howToFindLink}
          </a>
        </li>
        <li>{messages.networks.howToFindThen}</li>
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
  const messages = useMessages();
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
        {messages.networks.neighborhoods} : {network.neighborhoodsLabel}
      </span>
      <span className="mt-1 font-mono text-sm text-zinc-800 dark:text-zinc-200">
        {messages.networks.code} {network.code}
      </span>
      <span className="mt-2 text-xs font-medium text-emerald-700 dark:text-emerald-400">
        {selected ? messages.networks.networkSelected : messages.networks.chooseNetwork}
      </span>
    </button>
  );
}

function NetworkCard({ network }: { network: DistributionNetworkViewModel }) {
  const messages = useMessages();
  return (
    <div className="rounded-lg border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
      <p className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
        {network.name}
      </p>
      <p className="mt-1 text-xs text-zinc-500">
        {messages.networks.neighborhoods} : {network.neighborhoodsLabel}
      </p>
      <p className="mt-1 font-mono text-sm text-zinc-800 dark:text-zinc-200">
        {messages.networks.code} {network.code}
      </p>
    </div>
  );
}
