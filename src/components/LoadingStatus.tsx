export function LoadingStatus({
  label,
  hint,
  skeleton = false,
}: {
  label: string;
  hint?: string;
  skeleton?: boolean;
}) {
  return (
    <div
      role="status"
      className="mt-3 rounded-lg border border-zinc-300 bg-white px-4 py-5 dark:border-zinc-700 dark:bg-zinc-950"
    >
      <div className="flex items-start gap-3">
        <span
          className="mt-0.5 inline-block size-5 shrink-0 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-800 dark:border-zinc-700 dark:border-t-zinc-100"
          aria-hidden
        />
        <div>
          <p className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
            {label}
          </p>
          {hint ? (
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">{hint}</p>
          ) : null}
        </div>
      </div>
      {skeleton ? (
        <div className="mt-4 space-y-3" aria-hidden>
          <div className="h-16 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="h-20 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800" />
            <div className="h-20 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800" />
            <div className="h-20 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800" />
          </div>
        </div>
      ) : null}
    </div>
  );
}
