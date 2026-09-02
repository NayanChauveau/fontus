"use client";

import { useEffect } from "react";
import { useMessages } from "@/presentation/i18n/useLocale";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const messages = useMessages();

  useEffect(() => {
    void fetch("/api/errors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scope: "ui",
        event: "app_error",
        message: error.message,
        digest: error.digest,
      }),
    });
  }, [error]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-16">
      <p className="text-sm text-zinc-800 dark:text-zinc-200">
        {messages.errors.unexpected}
      </p>
      <button
        type="button"
        onClick={reset}
        className="text-sm font-medium text-emerald-800 underline dark:text-emerald-300"
      >
        {messages.errors.retry}
      </button>
    </div>
  );
}
