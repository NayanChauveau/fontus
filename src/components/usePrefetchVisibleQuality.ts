"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { fetchNetworkQuality } from "@/components/fetchNetworkQuality";
import { queryKeys } from "@/presentation/query/queryKeys";
import { useAfterHydration } from "@/presentation/query/useAfterHydration";

const PREFETCH_ROOT_MARGIN = "160px 0px";

export function usePrefetchVisibleQuality(networkCode: string) {
  const nodeRef = useRef<HTMLButtonElement | null>(null);
  const hydrated = useAfterHydration();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = nodeRef.current;
    if (
      !hydrated ||
      !networkCode ||
      !node ||
      typeof IntersectionObserver === "undefined"
    ) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) {
          return;
        }
        setVisible(true);
        observer.disconnect();
      },
      { rootMargin: PREFETCH_ROOT_MARGIN },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hydrated, networkCode]);

  useQuery({
    queryKey: queryKeys.quality(networkCode),
    queryFn: ({ signal }) => fetchNetworkQuality(networkCode, signal),
    enabled: hydrated && visible && Boolean(networkCode),
  });

  return nodeRef;
}
