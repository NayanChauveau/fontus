import {
  latestSample,
  isFreshAnalysisSync,
  type AnalysisSample,
} from "../../domain/Analysis";
import {
  ANALYSIS_WINDOW_MONTHS,
  chooseAnalysisWindow,
  windowFromDate,
} from "../../domain/chooseAnalysisWindow";
import type { AnalysesCachePort } from "../ports/AnalysesCachePort";
import type { ResultatsDisGatewayPort } from "../ports/ResultatsDisGatewayPort";

const MAX_PAGES = 20;

export type GetNetworkAnalysesResult = {
  networkCode: string;
  windowFrom: string;
  source: "cache" | "remote";
  latestSample: AnalysisSample | null;
};

export class GetNetworkAnalyses {
  constructor(
    private readonly gateway: ResultatsDisGatewayPort,
    private readonly cache: AnalysesCachePort,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(networkCode: string): Promise<GetNetworkAnalysesResult> {
    const now = this.now();
    const cached = await this.readFresh(networkCode, now);
    if (cached) {
      console.info(
        JSON.stringify({
          scope: "analyses",
          event: "cache_hit",
          networkCode,
        }),
      );
      return {
        networkCode,
        windowFrom: cached.windowFrom,
        source: "cache",
        latestSample: latestSample(cached.samples),
      };
    }

    const window = await this.resolveWindow(networkCode, now);
    const samples = await this.fetchAllPages(networkCode, window.dateMin);
    await this.persist(networkCode, samples, window.dateMin, now);

    console.info(
      JSON.stringify({
        scope: "analyses",
        event: "hubeau_fetch",
        networkCode,
        windowFrom: window.dateMin,
        sampleCount: samples.length,
      }),
    );

    return {
      networkCode,
      windowFrom: window.dateMin,
      source: "remote",
      latestSample: latestSample(samples),
    };
  }

  private async readFresh(networkCode: string, now: Date) {
    try {
      const cached = await this.cache.read(networkCode);
      if (!cached || !isFreshAnalysisSync(cached.fetchedAt, now)) {
        return null;
      }
      return cached;
    } catch {
      return null;
    }
  }

  private async persist(
    networkCode: string,
    samples: AnalysisSample[],
    windowFrom: string,
    fetchedAt: Date,
  ) {
    try {
      await this.cache.write({
        networkCode,
        samples,
        windowFrom,
        fetchedAt,
      });
    } catch {
      // Cache is an optimization.
    }
  }

  private async resolveWindow(networkCode: string, now: Date) {
    const counts = [];
    for (const months of ANALYSIS_WINDOW_MONTHS) {
      const dateMin = windowFromDate(now, months);
      const count = await this.gateway.count(networkCode, dateMin);
      counts.push({ months, count });
    }
    const chosen = chooseAnalysisWindow(counts);
    return {
      months: chosen.months,
      dateMin: windowFromDate(now, chosen.months),
    };
  }

  private async fetchAllPages(networkCode: string, dateMin: string) {
    const merged = new Map<string, AnalysisSample>();
    let next: string | undefined;
    for (let page = 0; page < MAX_PAGES; page += 1) {
      const result = await this.gateway.listPage(networkCode, dateMin, next);
      mergeSamples(merged, result.samples);
      if (!result.next) {
        break;
      }
      next = result.next;
    }
    return [...merged.values()];
  }
}

function mergeSamples(
  into: Map<string, AnalysisSample>,
  incoming: AnalysisSample[],
) {
  for (const sample of incoming) {
    const existing = into.get(sample.code);
    if (!existing) {
      into.set(sample.code, sample);
      continue;
    }
    for (const measurement of sample.measurements) {
      if (
        !existing.measurements.some(
          (item) => item.parameterCode === measurement.parameterCode,
        )
      ) {
        existing.measurements.push(measurement);
      }
    }
  }
}
