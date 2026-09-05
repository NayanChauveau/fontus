/** @vitest-environment happy-dom */

import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useShareUrl } from "./useShareUrl";

const replace = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ replace }),
  useSearchParams: () =>
    new URLSearchParams("insee=33063&udi=033001214"),
}));

describe("useShareUrl", () => {
  it("reads and writes the share query", () => {
    const { result } = renderHook(() => useShareUrl());
    expect(result.current.citycode).toBe("33063");
    expect(result.current.networkCode).toBe("033001214");

    result.current.replaceShare({
      citycode: "33063",
      networkCode: null,
    });
    expect(replace).toHaveBeenCalledWith("/?insee=33063", { scroll: false });

    result.current.replaceShare({ citycode: null, networkCode: null });
    expect(replace).toHaveBeenCalledWith("/", { scroll: false });
  });
});
