"use client";

import { LoadingStatus } from "@/components/LoadingStatus";
import { useNetworkQuality } from "@/components/useNetworkQuality";
import { NetworkAnalysesResults } from "@/components/NetworkAnalysesResults";
import { useMessages } from "@/presentation/i18n/useLocale";

export function NetworkAnalyses({ networkCode }: { networkCode: string }) {
  const messages = useMessages();
  const { status, viewModel } = useNetworkQuality(networkCode);

  return (
    <section
      aria-busy={status === "loading"}
      aria-live="polite"
      className="min-w-0 overflow-x-hidden rounded-xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
        {messages.analyses.title}
      </h3>

      {status === "loading" && (
        <LoadingStatus
          label={messages.analyses.loading}
          hint={messages.analyses.loadingHint}
          skeleton
        />
      )}

      {status === "unavailable" && (
        <p className="mt-3 text-sm text-red-700 dark:text-red-400">
          {messages.analyses.unavailable}
        </p>
      )}

      {status === "ready" && viewModel && (
        <NetworkAnalysesResults viewModel={viewModel} />
      )}
    </section>
  );
}
