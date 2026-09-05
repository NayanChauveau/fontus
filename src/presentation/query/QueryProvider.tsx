"use client";

import { useState, type ReactNode } from "react";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createQueryClient } from "./createQueryClient";
import { createPersistOptions } from "./queryPersist";

export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(createQueryClient);
  const [persistOptions] = useState(createPersistOptions);

  return (
    <PersistQueryClientProvider
      client={client}
      persistOptions={persistOptions}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
