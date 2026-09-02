"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import type { AddressSuggestionDto } from "@/application/dtos/AddressDto";
import { MIN_ADDRESS_QUERY_LENGTH } from "@/application/addressQuery";
import { DistributionNetworkList } from "@/components/DistributionNetworkList";
import { mapAddressDtoToViewModel } from "@/presentation/mappers/mapAddressDto";
import { useMessages } from "@/presentation/i18n/useLocale";
import type { AddressSuggestionViewModel } from "@/presentation/view-models/AddressViewModel";

const DEBOUNCE_MS = 300;

type SearchStatus = "idle" | "loading" | "ready" | "unavailable";

export function AddressSearch() {
  const messages = useMessages();
  const listboxId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<SearchStatus>("idle");
  const [suggestions, setSuggestions] = useState<AddressSuggestionViewModel[]>(
    [],
  );
  const [activeIndex, setActiveIndex] = useState(-1);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<AddressSuggestionViewModel | null>(
    null,
  );
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < MIN_ADDRESS_QUERY_LENGTH) {
      return;
    }

    const handle = window.setTimeout(() => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setStatus("loading");

      void (async () => {
        try {
          const response = await fetch(
            `/api/addresses/suggest?q=${encodeURIComponent(trimmed)}`,
            { signal: controller.signal },
          );
          const payload = (await response.json()) as
            | { suggestions: AddressSuggestionDto[] }
            | { error: string };

          if (!response.ok || "error" in payload) {
            setSuggestions([]);
            setStatus("unavailable");
            setOpen(true);
            return;
          }

          setSuggestions(payload.suggestions.map(mapAddressDtoToViewModel));
          setActiveIndex(-1);
          setStatus("ready");
          setOpen(true);
        } catch (error) {
          if (isAbortError(error)) {
            return;
          }
          setSuggestions([]);
          setStatus("unavailable");
          setOpen(true);
        }
      })();
    }, DEBOUNCE_MS);

    return () => {
      window.clearTimeout(handle);
      abortRef.current?.abort();
    };
  }, [query]);

  async function selectSuggestion(suggestion: AddressSuggestionViewModel) {
    setOpen(false);
    setResolving(true);
    setSelected(suggestion);

    try {
      const response = await fetch("/api/addresses/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: suggestion.id, label: suggestion.label }),
      });
      const payload = (await response.json()) as
        | { address: AddressSuggestionDto | null }
        | { error: string };

      if (response.ok && "address" in payload && payload.address) {
        setSelected(mapAddressDtoToViewModel(payload.address));
      }
    } catch {
      // Keep the suggestion already shown — I1 needs the fields visible.
    } finally {
      setResolving(false);
    }
  }

  function clearSelection() {
    setSelected(null);
    setQuery("");
    setSuggestions([]);
    setStatus("idle");
    inputRef.current?.focus();
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % suggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) =>
        index <= 0 ? suggestions.length - 1 : index - 1,
      );
    } else if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      const suggestion = suggestions[activeIndex];
      if (suggestion) {
        void selectSuggestion(suggestion);
      }
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">
          {messages.address.title}
        </h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {messages.address.subtitle}
        </p>
      </div>

      <div className="relative">
        <label
          htmlFor="address-query"
          className="mb-2 block text-sm font-medium text-zinc-800 dark:text-zinc-200"
        >
          {messages.address.label}
        </label>
        <input
          ref={inputRef}
          id="address-query"
          type="search"
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={
            activeIndex >= 0 ? `${listboxId}-${activeIndex}` : undefined
          }
          placeholder={messages.address.placeholder}
          value={query}
          onChange={(event) => {
            const next = event.target.value;
            setSelected(null);
            setQuery(next);
            if (next.trim().length < MIN_ADDRESS_QUERY_LENGTH) {
              abortRef.current?.abort();
              setSuggestions([]);
              setStatus("idle");
              setOpen(false);
            }
          }}
          onKeyDown={onKeyDown}
          className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-base text-zinc-950 outline-none ring-emerald-600/30 placeholder:text-zinc-400 focus:border-emerald-600 focus:ring-3 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50"
        />

        {open && (
          <ul
            id={listboxId}
            role="listbox"
            className="absolute z-10 mt-2 max-h-72 w-full overflow-auto rounded-xl border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-800 dark:bg-zinc-900"
          >
            {status === "loading" && (
              <li className="px-4 py-3 text-sm text-zinc-500">
                {messages.address.searching}
              </li>
            )}
            {status === "unavailable" && (
              <li className="px-4 py-3 text-sm text-red-700 dark:text-red-400">
                {messages.address.unavailable}
              </li>
            )}
            {status === "ready" && suggestions.length === 0 && (
              <li className="px-4 py-3 text-sm text-zinc-500">
                {messages.address.noResults}
              </li>
            )}
            {status === "ready" &&
              suggestions.map((suggestion, index) => (
                <li
                  key={suggestion.id}
                  id={`${listboxId}-${index}`}
                  role="option"
                  aria-selected={index === activeIndex}
                >
                  <button
                    type="button"
                    className={`flex w-full flex-col items-start px-4 py-2.5 text-left ${
                      index === activeIndex
                        ? "bg-emerald-50 dark:bg-emerald-950/40"
                        : "hover:bg-zinc-50 dark:hover:bg-zinc-800"
                    }`}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => {
                      void selectSuggestion(suggestion);
                    }}
                  >
                    <span className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
                      {suggestion.label}
                    </span>
                    <span className="text-xs text-zinc-500">
                      {suggestion.city} · {suggestion.citycode}
                    </span>
                  </button>
                </li>
              ))}
          </ul>
        )}
      </div>

      {selected && (
        <section
          aria-live="polite"
          className="rounded-xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
              {messages.address.selectedTitle}
            </h3>
            <button
              type="button"
              onClick={clearSelection}
              className="text-sm text-emerald-700 underline-offset-2 hover:underline dark:text-emerald-400"
            >
              {messages.address.clear}
            </button>
          </div>
          <dl className="grid gap-3 text-sm">
            <Field label={messages.address.fieldLabel} value={selected.label} />
            <Field label={messages.address.fieldCity} value={selected.city} />
            <div className="hidden md:contents">
              <Field
                label={messages.address.fieldCitycode}
                value={selected.citycode}
              />
              <Field
                label={messages.address.fieldCoordinates}
                value={selected.coordinates}
              />
            </div>
          </dl>
        </section>
      )}

      {selected && !resolving && (
        <DistributionNetworkList
          key={selected.citycode}
          citycode={selected.citycode}
        />
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-medium text-zinc-700 dark:text-zinc-300">{label}</dt>
      <dd className="font-mono text-zinc-950 dark:text-zinc-50">{value}</dd>
    </div>
  );
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}
