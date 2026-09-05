import { parseHubeauUrl } from "@/shared/infrastructure/http/assertHubeauUrl";
import type { RawUdiLink } from "../../domain/DistributionNetwork";
import type { CommunesUdiGatewayPort } from "../../application/ports/CommunesUdiGatewayPort";
import { parseCommunesUdiResponse } from "./parseCommunesUdiResponse";

const HUBEAU_COMMUNES_UDI_URL =
  "https://hubeau.eaufrance.fr/api/v1/qualite_eau_potable/communes_udi";

const REQUEST_TIMEOUT_MS = 20_000;
const MAX_PAGES = 5;
const MAX_ATTEMPTS = 2;

export type HttpGet = (url: URL, init: RequestInit) => Promise<Response>;

export function createHubeauCommunesUdiGateway(
  httpGet: HttpGet = fetch,
): CommunesUdiGatewayPort {
  return {
    async listByCommune(citycode, year) {
      const links: RawUdiLink[] = [];
      let pageUrl = new URL(HUBEAU_COMMUNES_UDI_URL);
      pageUrl.searchParams.set("code_commune", citycode);
      pageUrl.searchParams.set("annee", String(year));
      pageUrl.searchParams.set("size", "100");

      for (let page = 0; page < MAX_PAGES; page += 1) {
        const payload = await getJson(httpGet, pageUrl);
        const parsed = parseCommunesUdiResponse(payload);
        links.push(...parsed.links);

        if (!parsed.next) {
          break;
        }
        pageUrl = parseHubeauUrl(parsed.next);
      }

      return links;
    },
  };
}

async function getJson(httpGet: HttpGet, url: URL): Promise<unknown> {
  let lastError: unknown;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    try {
      const response = await httpGet(url, {
        cache: "no-store",
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        headers: {
          Accept: "application/json",
          "User-Agent": "fontus/0.1 (https://fontus.fr)",
        },
      });
      if (!response.ok) {
        throw new Error(`HUBEAU_HTTP_${response.status}`);
      }
      return response.json();
    } catch (error) {
      lastError = error;
      if (error instanceof Error && error.message.startsWith("HUBEAU_HTTP_")) {
        throw error;
      }
    }
  }

  throw new Error("HUBEAU_REQUEST_FAILED", { cause: lastError });
}
