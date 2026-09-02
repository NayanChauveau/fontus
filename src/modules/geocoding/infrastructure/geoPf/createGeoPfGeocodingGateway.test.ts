import { describe, expect, it, vi } from "vitest";
import {
  createGeoPfGeocodingGateway,
  GEO_PF_SEARCH_URL,
  type HttpGet,
} from "./createGeoPfGeocodingGateway";

describe("createGeoPfGeocodingGateway", () => {
  it("calls GeoPF /search with address index and autocomplete", async () => {
    const httpGet = vi.fn<HttpGet>(async () =>
      Response.json({
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            geometry: { type: "Point", coordinates: [-0.574364, 44.841405] },
            properties: {
              label: "12 Rue Sainte-Catherine 33000 Bordeaux",
              id: "33063_8390_00012",
              city: "Bordeaux",
              citycode: "33063",
            },
          },
        ],
      }),
    );

    const gateway = createGeoPfGeocodingGateway(httpGet);
    const results = await gateway.search("12 rue Sainte-Catherine, Bordeaux", {
      autocomplete: true,
      limit: 7,
    });

    expect(results).toHaveLength(1);
    expect(results[0]?.citycode).toBe("33063");

    const [url] = httpGet.mock.calls[0] ?? [];
    expect(url).toBeInstanceOf(URL);
    expect(url?.origin + url?.pathname).toBe(GEO_PF_SEARCH_URL);
    expect(url?.searchParams.get("q")).toBe(
      "12 rue Sainte-Catherine, Bordeaux",
    );
    expect(url?.searchParams.get("index")).toBe("address");
    expect(url?.searchParams.get("autocomplete")).toBe("1");
    expect(url?.searchParams.get("limit")).toBe("7");
  });

  it("throws when GeoPF is unreachable", async () => {
    const gateway = createGeoPfGeocodingGateway(async () => {
      throw new Error("ECONNRESET");
    });

    await expect(
      gateway.search("Bordeaux", { autocomplete: true, limit: 5 }),
    ).rejects.toThrow("GEO_PF_REQUEST_FAILED");
  });

  it("throws on an HTTP error", async () => {
    const gateway = createGeoPfGeocodingGateway(
      async () => new Response("nope", { status: 502 }),
    );
    await expect(
      gateway.search("Bordeaux", { autocomplete: false, limit: 5 }),
    ).rejects.toThrow("GEO_PF_HTTP_502");
  });
});
