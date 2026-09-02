"use client";

import { useSyncExternalStore } from "react";
import { readLocale, subscribeLocale } from "./locale";
import { getMessages, type Locale, type Messages } from "./messages";

export function useLocale(): Locale {
  return useSyncExternalStore(subscribeLocale, readLocale, () => "fr");
}

export function useMessages(): Messages {
  return getMessages(useLocale());
}
