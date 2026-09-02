import { describe, expect, it } from "vitest";
import { createHubeauCommunesUdiGateway } from "./createHubeauCommunesUdiGateway";

describe("createHubeauCommunesUdiGateway", () => {
  it("paginates communes_udi until next is null", async () => {
    const urls: string[] = [];
    const gateway = createHubeauCommunesUdiGateway(async (url) => {
      urls.push(url.toString());
      if (urls.length === 1) {
        return new Response(
          JSON.stringify({
            next: "https://hubeau.eaufrance.fr/api/v1/qualite_eau_potable/communes_udi?page=2",
            data: [
              {
                code_commune: "33063",
                nom_commune: "Bordeaux",
                code_reseau: "033001214",
                nom_reseau: "PAULIN",
                annee: "2026",
              },
            ],
          }),
        );
      }
      return new Response(JSON.stringify({ next: null, data: [] }));
    });

    const links = await gateway.listByCommune("33063", 2026);
    expect(links[0]?.networkCode).toBe("033001214");
    expect(urls[0]).toContain("code_commune=33063");
    expect(urls).toHaveLength(2);
  });

  it("rejects a next URL outside the official host", async () => {
    const gateway = createHubeauCommunesUdiGateway(async () => {
      return new Response(
        JSON.stringify({
          next: "https://evil.test/page/2",
          data: [],
        }),
      );
    });
    await expect(gateway.listByCommune("33063", 2026)).rejects.toThrow(
      "HUBEAU_UNTRUSTED_NEXT",
    );
  });

  it("throws when Hub’Eau is unreachable or not ok", async () => {
    const down = createHubeauCommunesUdiGateway(async () => {
      throw new Error("offline");
    });
    await expect(down.listByCommune("33063", 2026)).rejects.toThrow(
      "HUBEAU_REQUEST_FAILED",
    );

    const http = createHubeauCommunesUdiGateway(
      async () => new Response("nope", { status: 500 }),
    );
    await expect(http.listByCommune("33063", 2026)).rejects.toThrow(
      "HUBEAU_HTTP_500",
    );
  });
});
