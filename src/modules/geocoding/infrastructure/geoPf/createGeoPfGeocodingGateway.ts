import type { GeocodingGatewayPort } from "../../application/ports/GeocodingGatewayPort";
import { parseGeoPfSearchResponse } from "./parseGeoPfSearchResponse";

export const GEO_PF_SEARCH_URL = "https://data.geopf.fr/geocodage/search";

const REQUEST_TIMEOUT_MS = 5_000;

export type HttpGet = (url: URL, init: RequestInit) => Promise<Response>;

export function createGeoPfGeocodingGateway(
  httpGet: HttpGet = fetch,
): GeocodingGatewayPort {
  return {
    async search(query, options) {
      const url = new URL(GEO_PF_SEARCH_URL);
      url.searchParams.set("q", query);
      url.searchParams.set("index", "address");
      url.searchParams.set("limit", String(options.limit));
      url.searchParams.set("autocomplete", options.autocomplete ? "1" : "0");

      let response: Response;
      try {
        response = await httpGet(url, {
          cache: "no-store",
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
          headers: {
            Accept: "application/json",
            "User-Agent": "eau-robinet/0.1 (tap-water-quality)",
          },
        });
      } catch (error) {
        throw new Error("GEO_PF_REQUEST_FAILED", { cause: error });
      }

      if (!response.ok) {
        throw new Error(`GEO_PF_HTTP_${response.status}`);
      }

      return parseGeoPfSearchResponse(await response.json());
    },
  };
}
