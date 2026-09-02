import { describe, expect, it } from "vitest";
import type { AnalysisSample } from "../../domain/Analysis";
import type { AnalysesCachePort } from "../ports/AnalysesCachePort";
import type {
  ResultatsDisGatewayPort,
  ResultatsDisPage,
} from "../ports/ResultatsDisGatewayPort";
import { GetNetworkAnalyses } from "./GetNetworkAnalyses";

const NOW = new Date("2026-09-02T08:00:00.000Z");
const PAULIN = "033001214";

const latest: AnalysisSample = {
  code: "03300277847",
  udiCode: PAULIN,
  sampledAt: new Date("2026-06-18T11:40:00.000Z"),
  conclusion: "Eau d'alimentation conforme.",
  conformiteLimitesBact: "C",
  conformiteLimitesPc: "C",
  communeInsee: "33063",
  source: "hubeau",
  measurements: [
    {
      parameterCode: "1339",
      parameterLabel: "Nitrites (en NO2)",
      rawText: "<0,01",
      numericValue: 0.01,
      qualifier: "lt",
      unit: "mg/L",
    },
  ],
};

describe("GetNetworkAnalyses", () => {
  it("returns the cached latest sample without calling Hub’Eau", async () => {
    let fetched = false;
    const useCase = new GetNetworkAnalyses(
      trackingGateway(() => {
        fetched = true;
      }),
      {
        async read() {
          return {
            networkCode: PAULIN,
            samples: [latest],
            fetchedAt: new Date("2026-09-01T00:00:00.000Z"),
            windowFrom: "2025-09-02",
          };
        },
        async write() {},
        async withNetworkLock(_networkCode, work) {
          return work();
        },
      },
      () => NOW,
    );

    const result = await useCase.execute(PAULIN);

    expect(fetched).toBe(false);
    expect(result.source).toBe("cache");
    expect(result.latestSample?.measurements[0]?.rawText).toBe("<0,01");
    expect(result.latestSample?.measurements[0]?.numericValue).toBe(0.01);
    expect(result.latestSample?.measurements[0]?.qualifier).toBe("lt");
    expect(result.historySnapshots).toEqual([]);
  });

  it("extracts a nitrates history from the cached window", async () => {
    const older: AnalysisSample = {
      ...latest,
      code: "s-old",
      sampledAt: new Date("2026-01-10T10:00:00.000Z"),
      measurements: [
        {
          parameterCode: "1340",
          parameterLabel: "Nitrates",
          rawText: "8",
          numericValue: 8,
          qualifier: "eq",
          unit: "mg/L",
        },
      ],
    };
    const newer: AnalysisSample = {
      ...latest,
      measurements: [
        ...latest.measurements,
        {
          parameterCode: "1340",
          parameterLabel: "Nitrates",
          rawText: "12",
          numericValue: 12,
          qualifier: "eq",
          unit: "mg/L",
        },
      ],
    };
    const useCase = new GetNetworkAnalyses(
      trackingGateway(() => {}),
      {
        async read() {
          return {
            networkCode: PAULIN,
            samples: [newer, older],
            fetchedAt: new Date("2026-09-01T00:00:00.000Z"),
            windowFrom: "2025-09-02",
          };
        },
        async write() {},
        async withNetworkLock(_networkCode, work) {
          return work();
        },
      },
      () => NOW,
    );

    const result = await useCase.execute(PAULIN);
    expect(result.historySnapshots.map((row) => row.measurement.numericValue)).toEqual([
      8, 12,
    ]);
  });

  it("keeps PFAS-20 companions from the same sample", async () => {
    const useCase = new GetNetworkAnalyses(
      trackingGateway(() => {}),
      {
        async read() {
          return {
            networkCode: PAULIN,
            samples: [
              {
                ...latest,
                measurements: [
                  {
                    parameterCode: "8847",
                    parameterLabel: "Somme PFAS-20",
                    rawText: "<SEUIL",
                    numericValue: null,
                    qualifier: "lt",
                    unit: "µg/L",
                  },
                  {
                    parameterCode: "5347",
                    parameterLabel: "PFOA",
                    rawText: "<0,001",
                    numericValue: 0.001,
                    qualifier: "lt",
                    unit: "µg/L",
                  },
                ],
              },
            ],
            fetchedAt: new Date("2026-09-01T00:00:00.000Z"),
            windowFrom: "2025-09-02",
          };
        },
        async write() {},
        async withNetworkLock(_networkCode, work) {
          return work();
        },
      },
      () => NOW,
    );

    const result = await useCase.execute(PAULIN);
    expect(result.historySnapshots.map((row) => row.measurement.parameterCode)).toEqual([
      "8847",
      "5347",
    ]);
  });

  it("picks a window under the soft cap then persists the latest sample", async () => {
    const written: Parameters<AnalysesCachePort["write"]>[0][] = [];
    const pages: string[] = [];
    const useCase = new GetNetworkAnalyses(
      {
        async count(_networkCode, dateMin) {
          if (dateMin <= "2023-09-02") {
            return 37113;
          }
          if (dateMin <= "2024-09-02") {
            return 22211;
          }
          if (dateMin <= "2025-03-02") {
            return 16576;
          }
          if (dateMin <= "2025-09-02") {
            return 8099;
          }
          return 4000;
        },
        async listPage(networkCode, dateMin) {
          pages.push(`${networkCode}:${dateMin}`);
          return {
            count: 8099,
            next: null,
            samples: [latest],
          };
        },
      },
      {
        async read() {
          return null;
        },
        async write(input) {
          written.push(input);
        },
        async withNetworkLock(_networkCode, work) {
          return work();
        },
      },
      () => NOW,
    );

    const result = await useCase.execute(PAULIN);

    expect(pages).toEqual(["033001214:2025-09-02"]);
    expect(result.source).toBe("remote");
    expect(result.windowFrom).toBe("2025-09-02");
    expect(result.latestSample?.conclusion).toBe(
      "Eau d'alimentation conforme.",
    );
    expect(written[0]?.networkCode).toBe(PAULIN);
    expect(written[0]?.samples).toHaveLength(1);
  });

  it("merges measurements of the same sample across pages", async () => {
    const older: AnalysisSample = {
      ...latest,
      code: "older",
      sampledAt: new Date("2026-01-01T00:00:00.000Z"),
      measurements: [
        {
          parameterCode: "1340",
          parameterLabel: "Nitrates (en NO3)",
          rawText: "12,3",
          numericValue: 12.3,
          qualifier: "eq",
          unit: "mg/L",
        },
      ],
    };
    const page2: AnalysisSample = {
      ...latest,
      measurements: [
        {
          parameterCode: "1383",
          parameterLabel: "Sodium",
          rawText: "8,4",
          numericValue: 8.4,
          qualifier: "eq",
          unit: "mg/L",
        },
      ],
    };

    let page = 0;
    const useCase = new GetNetworkAnalyses(
      {
        async count() {
          return 2;
        },
        async listPage(): Promise<ResultatsDisPage> {
          page += 1;
          if (page === 1) {
            return { count: 2, next: "https://hubeau.example/page/2", samples: [latest, older] };
          }
          return { count: 2, next: null, samples: [page2] };
        },
      },
      memoryCache(),
      () => NOW,
    );

    const result = await useCase.execute(PAULIN);
    const codes = result.latestSample?.measurements.map(
      (measurement) => measurement.parameterCode,
    );

    expect(result.latestSample?.code).toBe(latest.code);
    expect(codes).toEqual(["1339", "1383"]);
    expect(
      result.latestMeasurements.map((row) => row.measurement.parameterCode).sort(),
    ).toEqual(["1339", "1340", "1383"]);
  });

  it("refetches when the cache is stale or unreadable and ignores a write failure", async () => {
    const reported: string[] = [];
    const useCase = new GetNetworkAnalyses(
      {
        async count() {
          return 1;
        },
        async listPage() {
          return { count: 1, next: null, samples: [latest] };
        },
      },
      {
        async read() {
          throw new Error("db");
        },
        async write() {
          throw new Error("db");
        },
        async withNetworkLock(_networkCode, work) {
          return work();
        },
      },
      () => NOW,
      {
        report(event) {
          reported.push(event.event);
        },
      },
    );

    const result = await useCase.execute(PAULIN);
    expect(result.source).toBe("remote");
    expect(result.latestSample?.code).toBe(latest.code);
    expect(reported).toEqual([
      "cache_read_failed",
      "cache_write_failed",
      "hubeau_fetch",
    ]);
  });

  it("ignores a stale cache entry", async () => {
    const useCase = new GetNetworkAnalyses(
      {
        async count() {
          return 1;
        },
        async listPage() {
          return { count: 1, next: null, samples: [latest] };
        },
      },
      {
        async read() {
          return {
            networkCode: PAULIN,
            samples: [latest],
            fetchedAt: new Date("2020-01-01T00:00:00.000Z"),
            windowFrom: "2019-01-01",
          };
        },
        async write() {},
        async withNetworkLock(_networkCode, work) {
          return work();
        },
      },
      () => NOW,
    );

    expect((await useCase.execute(PAULIN)).source).toBe("remote");
  });

  it("uses the system clock by default and skips a duplicate measurement on merge", async () => {
    const useCase = new GetNetworkAnalyses(
      {
        async count() {
          return 1;
        },
        async listPage() {
          return {
            count: 1,
            next: null,
            samples: [
              latest,
              {
                ...latest,
                measurements: [
                  latest.measurements[0]!,
                  {
                    parameterCode: "1383",
                    parameterLabel: "Sodium",
                    rawText: "8,4",
                    numericValue: 8.4,
                    qualifier: "eq",
                    unit: "mg/L",
                  },
                ],
              },
            ],
          };
        },
      },
      memoryCache(),
    );

    const result = await useCase.execute(PAULIN);
    expect(result.latestSample?.measurements).toHaveLength(2);
  });

  it("shares one Hub’Eau crawl across concurrent calls", async () => {
    let pages = 0;
    const useCase = new GetNetworkAnalyses(
      {
        async count() {
          return 1;
        },
        async listPage() {
          pages += 1;
          return { count: 1, next: null, samples: [latest] };
        },
      },
      memoryCache(),
      () => NOW,
    );

    const [first, second] = await Promise.all([
      useCase.execute(PAULIN),
      useCase.execute(PAULIN),
    ]);

    expect(first.latestSample?.code).toBe(latest.code);
    expect(second.latestSample?.code).toBe(latest.code);
    expect(pages).toBe(1);
  });

  it("keeps a shorter window when a longer count fails", async () => {
    const pages: string[] = [];
    const useCase = new GetNetworkAnalyses(
      {
        async count(_networkCode, dateMin) {
          if (dateMin <= "2025-09-02") {
            throw new Error("timeout");
          }
          return 4000;
        },
        async listPage(networkCode, dateMin) {
          pages.push(`${networkCode}:${dateMin}`);
          return { count: 4000, next: null, samples: [latest] };
        },
      },
      memoryCache(),
      () => NOW,
    );

    const result = await useCase.execute(PAULIN);
    expect(result.windowFrom).toBe("2026-03-02");
    expect(pages).toEqual(["033001214:2026-03-02"]);
  });

  it("returns the first page when a later Hub’Eau page fails", async () => {
    let page = 0;
    const written: Parameters<AnalysesCachePort["write"]>[0][] = [];
    const useCase = new GetNetworkAnalyses(
      {
        async count() {
          return 2;
        },
        async listPage(): Promise<ResultatsDisPage> {
          page += 1;
          if (page === 1) {
            return {
              count: 2,
              next: "https://hubeau.example/page/2",
              samples: [latest],
            };
          }
          throw new Error("timeout");
        },
      },
      {
        async read() {
          return null;
        },
        async write(input) {
          written.push(input);
        },
        async withNetworkLock(_networkCode, work) {
          return work();
        },
      },
      () => NOW,
    );

    const result = await useCase.execute(PAULIN);
    expect(result.latestSample?.code).toBe(latest.code);
    expect(written).toEqual([]);
  });

  it("still fetches six months when every count fails, and rethrows an empty crawl", async () => {
    const ok = new GetNetworkAnalyses(
      {
        async count() {
          throw new Error("timeout");
        },
        async listPage() {
          return { count: 0, next: null, samples: [latest] };
        },
      },
      memoryCache(),
      () => NOW,
    );
    expect((await ok.execute(PAULIN)).windowFrom).toBe("2026-03-02");

    const empty = new GetNetworkAnalyses(
      {
        async count() {
          return 1;
        },
        async listPage() {
          throw new Error("down");
        },
      },
      memoryCache(),
      () => NOW,
    );
    await expect(empty.execute(PAULIN)).rejects.toThrow("down");
  });

  it("does not persist an empty complete crawl", async () => {
    let wrote = false;
    const useCase = new GetNetworkAnalyses(
      {
        async count() {
          return 0;
        },
        async listPage() {
          return { count: 0, next: null, samples: [] };
        },
      },
      {
        async read() {
          return null;
        },
        async write() {
          wrote = true;
        },
        async withNetworkLock(_networkCode, work) {
          return work();
        },
      },
      () => NOW,
    );

    const result = await useCase.execute(PAULIN);
    expect(result.latestSample).toBeNull();
    expect(wrote).toBe(false);
  });

  it("uses Hub’Eau when no DIS importer is configured above the cap", async () => {
    const useCase = new GetNetworkAnalyses(
      {
        async count() {
          return 25_000;
        },
        async listPage() {
          return { count: 25_000, next: null, samples: [latest] };
        },
      },
      memoryCache(),
      () => NOW,
    );

    expect((await useCase.execute(PAULIN)).source).toBe("remote");
  });

  it("imports DIS files when Hub’Eau exceeds the hard cap", async () => {
    let listed = false;
    const imported: AnalysisSample = {
      ...latest,
      source: "dis",
    };
    const useCase = new GetNetworkAnalyses(
      {
        async count() {
          return 25_000;
        },
        async listPage() {
          listed = true;
          return { count: 25_000, next: null, samples: [] };
        },
      },
      memoryCache(),
      () => NOW,
      { report() {} },
      {
        async listByNetwork() {
          return [imported];
        },
      },
    );

    const result = await useCase.execute(PAULIN);
    expect(result.source).toBe("import");
    expect(result.latestSample?.source).toBe("dis");
    expect(listed).toBe(false);
  });

  it("falls back to Hub’Eau when the DIS import is empty or fails", async () => {
    const reported: string[] = [];
    const emptyImport = new GetNetworkAnalyses(
      {
        async count() {
          return 25_000;
        },
        async listPage() {
          return { count: 25_000, next: null, samples: [latest] };
        },
      },
      memoryCache(),
      () => NOW,
      { report() {} },
      {
        async listByNetwork() {
          return [];
        },
      },
    );
    expect((await emptyImport.execute(PAULIN)).source).toBe("remote");

    const failingImport = new GetNetworkAnalyses(
      {
        async count() {
          return 25_000;
        },
        async listPage() {
          return { count: 25_000, next: null, samples: [latest] };
        },
      },
      memoryCache(),
      () => NOW,
      {
        report(event) {
          reported.push(event.event);
        },
      },
      {
        async listByNetwork() {
          throw new Error("zip missing");
        },
      },
    );
    expect((await failingImport.execute(PAULIN)).source).toBe("remote");
    expect(reported).toEqual(["dis_import_failed", "hubeau_fetch"]);
  });
});

function trackingGateway(onCall: () => void): ResultatsDisGatewayPort {
  return {
    async count() {
      onCall();
      return 0;
    },
    async listPage() {
      onCall();
      return { count: 0, next: null, samples: [] };
    },
  };
}

function memoryCache(): AnalysesCachePort {
  return {
    async read() {
      return null;
    },
    async write() {},
    async withNetworkLock(_networkCode, work) {
      return work();
    },
  };
}
