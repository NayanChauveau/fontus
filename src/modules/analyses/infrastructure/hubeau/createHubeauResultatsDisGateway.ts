import { parseHubeauUrl } from "@/shared/infrastructure/http/assertHubeauUrl";
import type { ResultatsDisGatewayPort } from "../../application/ports/ResultatsDisGatewayPort";
import { parseResultatsDisResponse } from "./parseResultatsDisResponse";

const HUBEAU_RESULTATS_DIS_URL =
  "https://hubeau.eaufrance.fr/api/v1/qualite_eau_potable/resultats_dis";

const REQUEST_TIMEOUT_MS = 20_000;
const PAGE_SIZE = 1000;

export type HttpGet = (url: URL, init: RequestInit) => Promise<Response>;

export function createHubeauResultatsDisGateway(
  httpGet: HttpGet = fetch,
): ResultatsDisGatewayPort {
  return {
    async count(networkCode, dateMin) {
      const url = buildSearchUrl(networkCode, dateMin, 1);
      const payload = await getJson(httpGet, url);
      return parseResultatsDisResponse(payload, networkCode).count;
    },

    async listPage(networkCode, dateMin, pageUrl) {
      const url = pageUrl
        ? parseHubeauUrl(pageUrl)
        : buildSearchUrl(networkCode, dateMin);
      const payload = await getJson(httpGet, url);
      return parseResultatsDisResponse(payload, networkCode);
    },
  };
}

function buildSearchUrl(
  networkCode: string,
  dateMin: string,
  size = PAGE_SIZE,
): URL {
  const url = new URL(HUBEAU_RESULTATS_DIS_URL);
  url.searchParams.set("code_reseau", networkCode);
  url.searchParams.set("date_min_prelevement", dateMin);
  url.searchParams.set("size", String(size));
  return url;
}

async function getJson(httpGet: HttpGet, url: URL): Promise<unknown> {
  let response: Response;
  try {
    response = await httpGet(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      headers: {
        Accept: "application/json",
        "User-Agent": "fontus/0.1 (https://fontus.fr)",
      },
    });
  } catch (error) {
    throw new Error("HUBEAU_REQUEST_FAILED", { cause: error });
  }

  if (!response.ok && response.status !== 206) {
    throw new Error(`HUBEAU_HTTP_${response.status}`);
  }

  return response.json();
}
