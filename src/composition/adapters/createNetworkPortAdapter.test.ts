import { describe, expect, it } from "vitest";
import { ApplicationError } from "@/application/errors/ApplicationError";
import { createNetworkPortAdapter } from "./createNetworkPortAdapter";

describe("createNetworkPortAdapter", () => {
  it("maps the module result and falls back to the requested citycode", async () => {
    const adapter = createNetworkPortAdapter({
      listNetworksForCommune: {
        async execute() {
          return {
            commune: {
              citycode: "",
              city: "Bordeaux",
              year: 2026,
              networks: [],
              hiddenNonResidentialCount: 0,
            },
            confidence: "none",
            source: "remote",
          };
        },
      } as never,
    });

    const dto = await adapter.listByCitycode("33063");
    expect(dto.citycode).toBe("33063");
    expect(dto.city).toBe("Bordeaux");
  });

  it("wraps module failures", async () => {
    const adapter = createNetworkPortAdapter({
      listNetworksForCommune: {
        async execute() {
          throw new Error("NO_DISTRIBUTION_NETWORK");
        },
      } as never,
    });

    await expect(adapter.listByCitycode("33063")).rejects.toBeInstanceOf(
      ApplicationError,
    );
  });
});
