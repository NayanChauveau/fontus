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
  const selection =
    parseSharePath(pathname) ?? parseShareSearch(searchParams.toString());

  function replaceShare(next: ShareSelection) {
    const path = pathForShare(next);
    router.replace(path, { scroll: path.startsWith("/eau-robinet") });
  }

  return { ...selection, replaceShare };
}
