"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

export function useAfterHydration() {
  return useSyncExternalStore(subscribe, () => true, () => false);
}
