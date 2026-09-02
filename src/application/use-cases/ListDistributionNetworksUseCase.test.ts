import { describe, expect, it } from "vitest";
import { ApplicationError } from "../errors/ApplicationError";
import { createFakeApplicationPorts } from "../ports/testing/createFakeApplicationPorts";
import { ListDistributionNetworksUseCase } from "./ListDistributionNetworksUseCase";

const bordeaux = {
  citycode: "33063",
  city: "Bordeaux",
  year: 2026,
  confidence: "ambiguous" as const,
  networks: [
    { code: "033001174", name: "CAP ROUX", neighborhoods: ["Ouest"] },
  ],
  hiddenNonResidentialCount: 0,
  selectedNetworkCode: null,
};

describe("ListDistributionNetworksUseCase", () => {
  it("returns none without calling the port when the citycode is invalid", async () => {
    let called = false;
    const { ports } = createFakeApplicationPorts({
      network: {
        async listByCitycode() {
          called = true;
          return bordeaux;
        },
      },
    });

    const result = await new ListDistributionNetworksUseCase(ports).execute(
      "33",
    );

    expect(result.confidence).toBe("none");
    expect(called).toBe(false);
  });

  it("delegates a valid INSEE code", async () => {
    const { ports } = createFakeApplicationPorts({
      network: {
        async listByCitycode(citycode) {
          expect(citycode).toBe("33063");
          return bordeaux;
        },
      },
    });

    const result = await new ListDistributionNetworksUseCase(ports).execute(
      "33063",
    );

    expect(result).toEqual(bordeaux);
    expect(result.selectedNetworkCode).toBeNull();
  });

  it("propagates NETWORKS_UNAVAILABLE", async () => {
    const { ports } = createFakeApplicationPorts({
      network: {
        async listByCitycode() {
          throw new ApplicationError("NETWORKS_UNAVAILABLE");
        },
      },
    });

    await expect(
      new ListDistributionNetworksUseCase(ports).execute("33063"),
    ).rejects.toMatchObject({ code: "NETWORKS_UNAVAILABLE" });
  });
});
