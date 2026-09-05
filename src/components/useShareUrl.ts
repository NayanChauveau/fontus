"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  buildShareSearch,
  parseShareSearch,
  type ShareSelection,
} from "@/presentation/shareSearch";

export function useShareUrl() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selection = parseShareSearch(searchParams.toString());

  function replaceShare(next: ShareSelection) {
    const search = buildShareSearch(next);
    router.replace(search ? `${pathname}?${search}` : pathname, {
      scroll: false,
    });
  }

  return { ...selection, replaceShare };
}
