/** @vitest-environment happy-dom */

import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useShareUrl } from "./useShareUrl";

const nav = vi.hoisted(() => ({
  pathname: "/",
  search: "insee=81004&udi=081004110",
  replace: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => nav.pathname,
  useRouter: () => ({ replace: nav.replace }),
  useSearchParams: () => new URLSearchParams(nav.search),
}));

describe("useShareUrl", () => {
  it("reads and writes the share query", () => {
    nav.pathname = "/";
    nav.search = "insee=81004&udi=081004110";
    const { result } = renderHook(() => useShareUrl());
    expect(result.current.citycode).toBe("81004");
    expect(result.current.networkCode).toBe("081004110");

    result.current.replaceShare({
      citycode: "81004",
      networkCode: null,
    });
    expect(nav.replace).toHaveBeenCalledWith("/?insee=81004", { scroll: false });

    result.current.replaceShare({
      citycode: "31555",
      networkCode: "031000006",
    });
    expect(nav.replace).toHaveBeenCalledWith("/eau-robinet/toulouse/031000006", {
      scroll: true,
    });

    result.current.replaceShare({ citycode: null, networkCode: null });
    expect(nav.replace).toHaveBeenCalledWith("/", { scroll: false });
  });

  it("reads a catalog city from the pretty path", () => {
    nav.pathname = "/eau-robinet/toulouse/031000006";
    nav.search = "";
    const { result } = renderHook(() => useShareUrl());
    expect(result.current.citycode).toBe("31555");
    expect(result.current.networkCode).toBe("031000006");
  });
});
