import { describe, expect, it } from "vitest";
import { createFakeDb } from "@/test/fakeDb";
import { createDrizzleAnalysesCache, udiSyncScope } from "./createDrizzleAnalysesCache";

const sample = {
  code: "s1",
  udiCode: "033001214",
  sampledAt: new Date("2026-06-18T11:40:00.000Z"),
  conclusion: "conforme",
  conformiteLimitesBact: "C",
  conformiteLimitesPc: "C",
  communeInsee: "33063",
  source: "hubeau",
  measurements: [
    {
      parameterCode: "1339",
      parameterLabel: "Nitrites",
      rawText: "<0,01",
      numericValue: 0.01,
      qualifier: "lt" as const,
      unit: "mg/L",
    },
  ],
};

describe("createDrizzleAnalysesCache", () => {
  it("builds the udi sync scope", () => {
    expect(udiSyncScope("033001214")).toBe("udi:033001214");
  });

  it("returns null without a fresh job", async () => {
    const cache = createDrizzleAnalysesCache(createFakeDb() as never);
    expect(await cache.read("033001214")).toBeNull();

    const noWindow = createDrizzleAnalysesCache(
      createFakeDb({
        selectResults: [[{ fetchedAt: new Date(), windowFrom: null }]],
      }) as never,
    );
    expect(await noWindow.read("033001214")).toBeNull();
  });

  it("reads a job with no samples", async () => {
    const cache = createDrizzleAnalysesCache(
      createFakeDb({
        selectResults: [
          [
            {
              fetchedAt: new Date("2026-09-01T00:00:00.000Z"),
              windowFrom: "2025-09-02",
            },
          ],
          [],
        ],
      }) as never,
    );

    const cached = await cache.read("033001214");
    expect(cached?.samples).toEqual([]);
  });

  it("reads samples and skips orphan measurements", async () => {
    const cache = createDrizzleAnalysesCache(
      createFakeDb({
        selectResults: [
          [
            {
              fetchedAt: new Date("2026-09-01T00:00:00.000Z"),
              windowFrom: "2025-09-02",
            },
          ],
          [
            {
              code: "s1",
              udiCode: "033001214",
              sampledAt: sample.sampledAt,
              conclusion: "conforme",
              conformiteLimitesBact: "C",
              conformiteLimitesPc: "C",
              communeInsee: "33063",
              source: "hubeau",
            },
          ],
          [
            {
              sampleCode: "s1",
              parameterCode: "1339",
              parameterLabel: "Nitrites",
              rawText: "<0,01",
              numericValue: "0.01",
              qualifier: "lt",
              unit: "mg/L",
            },
            {
              sampleCode: "missing",
              parameterCode: "1",
              parameterLabel: "x",
              rawText: "1",
              numericValue: null,
              qualifier: "eq",
              unit: null,
            },
          ],
        ],
      }) as never,
    );

    const cached = await cache.read("033001214");
    expect(cached?.samples[0]?.measurements[0]?.numericValue).toBe(0.01);
    expect(cached?.samples[0]?.measurements).toHaveLength(1);
  });

  it("writes empty and non-empty snapshots", async () => {
    const cache = createDrizzleAnalysesCache(
      createFakeDb({
        selectResults: [[{ code: "old" }]],
      }) as never,
    );

    await cache.write({
      networkCode: "033001214",
      samples: [],
      fetchedAt: new Date(),
      windowFrom: "2025-09-02",
    });
    await cache.write({
      networkCode: "033001214",
      samples: [sample],
      fetchedAt: new Date(),
      windowFrom: "2025-09-02",
    });
    await cache.write({
      networkCode: "033001214",
      samples: [
        {
          ...sample,
          measurements: [
            { ...sample.measurements[0]!, numericValue: null },
          ],
        },
      ],
      fetchedAt: new Date(),
      windowFrom: "2025-09-02",
    });
  });
});
