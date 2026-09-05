/** @vitest-environment happy-dom */

import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useAfterHydration } from "./useAfterHydration";

function Probe() {
  return useAfterHydration() ? "client" : "server";
}

describe("useAfterHydration", () => {
  it("uses the server snapshot during SSR", () => {
    expect(renderToString(createElement(Probe))).toBe("server");
  });

  it("is immediately true on the client", () => {
    const { result } = renderHook(() => useAfterHydration());
    expect(result.current).toBe(true);
  });
});
