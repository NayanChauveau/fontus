"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  parseSharePath,
  parseShareSearch,
  pathForShare,
  type ShareSelection,
} from "@/presentation/shareSearch";

export function useShareUrl() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const fromSearch = parseShareSearch(searchParams.toString());
  const fromPath = parseSharePath(pathname);
  const selection = fromPath
    ? { ...fromPath, addressLabel: fromSearch.addressLabel }
    : fromSearch;

  function replaceShare(next: ShareSelection) {
    const path = pathForShare(next);
    router.replace(path, { scroll: false });
  }

  return { ...selection, replaceShare };
}
