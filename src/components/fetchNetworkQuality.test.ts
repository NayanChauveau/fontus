import { describe, expect, it, vi } from "vitest";
import { fetchNetworkQuality, qualityUrl } from "./fetchNetworkQuality";

describe("fetchNetworkQuality", () => {
  it("builds the quality URL with an optional refresh flag", () => {
    expect(qualityUrl("033001214")).toBe("/api/udi/033001214/quality");
    expect(qualityUrl("033001214", true)).toBe(
      "/api/udi/033001214/quality?refresh=1",
    );
  });

  it("fetches the quality payload", async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({ networkCode: "033001214", source: "cache" }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const signal = new AbortController().signal;

    const payload = await fetchNetworkQuality("033001214", signal, true);

    expect(payload.networkCode).toBe("033001214");
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/udi/033001214/quality?refresh=1",
      { signal },
    );
    vi.unstubAllGlobals();
  });
});
