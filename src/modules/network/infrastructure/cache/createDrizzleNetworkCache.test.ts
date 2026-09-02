import { describe, expect, it } from "vitest";
import { createFakeDb } from "@/test/fakeDb";
import {
  communeSyncScope,
  createDrizzleNetworkCache,
} from "./createDrizzleNetworkCache";

describe("createDrizzleNetworkCache", () => {
  it("builds the commune sync scope", () => {
    expect(communeSyncScope("33063", 2026)).toBe("commune:33063:2026");
  });

  it("returns null without a job", async () => {
    const cache = createDrizzleNetworkCache(createFakeDb() as never);
    expect(await cache.read("33063", 2026)).toBeNull();
  });

  it("reads grouped links", async () => {
    const cache = createDrizzleNetworkCache(
      createFakeDb({
        selectResults: [
          [{ fetchedAt: new Date("2026-09-01T00:00:00.000Z") }],
          [
            {
              citycode: "33063",
              city: "Bordeaux",
              networkCode: "033001214",
              networkName: "PAULIN",
              neighborhood: "Centre",
              year: 2026,
              supplyStartedOn: null,
            },
          ],
        ],
      }) as never,
    );

    const cached = await cache.read("33063", 2026);
    expect(cached?.links[0]?.networkCode).toBe("033001214");
    expect(cached?.city).toBe("Bordeaux");
  });

  it("falls back to an empty city when the job has no rows", async () => {
    const cache = createDrizzleNetworkCache(
      createFakeDb({
        selectResults: [[{ fetchedAt: new Date("2026-09-01T00:00:00.000Z") }], []],
      }) as never,
    );

    const cached = await cache.read("33063", 2026);
    expect(cached?.city).toBe("");
    expect(cached?.links).toEqual([]);
  });

  it("writes empty and non-empty communes", async () => {
    const cache = createDrizzleNetworkCache(createFakeDb() as never);
    await cache.write({
      citycode: "33063",
      city: "",
      year: 2026,
      links: [],
      fetchedAt: new Date(),
    });
    await cache.write({
      citycode: "33063",
      city: "Bordeaux",
      year: 2026,
      links: [
        {
          citycode: "33063",
          city: "Bordeaux",
          networkCode: "033001214",
          networkName: "PAULIN",
          neighborhood: "Centre",
          year: 2026,
          supplyStartedOn: null,
        },
        {
          citycode: "33063",
          city: "Bordeaux",
          networkCode: "033001214",
          networkName: "PAULIN",
          neighborhood: "Nord",
          year: 2026,
          supplyStartedOn: null,
        },
      ],
      fetchedAt: new Date(),
    });
  });
});
