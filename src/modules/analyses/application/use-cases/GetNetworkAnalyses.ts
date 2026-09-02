import {
  latestMeasurementsByParameter,
  latestSample,
  isFreshAnalysisSync,
  HUBEAU_ROW_SOFT_CAP,
  type AnalysisSample,
  type ParameterSnapshot,
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
  latestMeasurements: ParameterSnapshot[];
};

export class GetNetworkAnalyses {
  private readonly inflight = new Map<string, Promise<GetNetworkAnalysesResult>>();

  constructor(
    private readonly gateway: ResultatsDisGatewayPort,
    private readonly cache: AnalysesCachePort,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(networkCode: string): Promise<GetNetworkAnalysesResult> {
    const running = this.inflight.get(networkCode);
    if (running) {
      return running;
    }

    const pending = this.load(networkCode).finally(() => {
      this.inflight.delete(networkCode);
    });
    this.inflight.set(networkCode, pending);
    return pending;
  }

  private async load(networkCode: string): Promise<GetNetworkAnalysesResult> {
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
      return toResult(
        networkCode,
        cached.windowFrom,
        "cache",
        cached.samples,
      );
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

    return toResult(networkCode, window.dateMin, "remote", samples);
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
    const counts: Array<{ months: number; count: number }> = [];
    for (const months of [...ANALYSIS_WINDOW_MONTHS].reverse()) {
      try {
        const count = await this.gateway.count(
          networkCode,
          windowFromDate(now, months),
        );
        counts.push({ months, count });
        if (count > HUBEAU_ROW_SOFT_CAP) {
          break;
        }
      } catch {
        // A timed-out long window must not hide a shorter one we can fetch.
        break;
      }
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
    try {
      for (let page = 0; page < MAX_PAGES; page += 1) {
        const result = await this.gateway.listPage(networkCode, dateMin, next);
        mergeSamples(merged, result.samples);
        if (!result.next) {
          break;
        }
        next = result.next;
      }
    } catch (error) {
      if (merged.size === 0) {
        throw error;
      }
    }
    return [...merged.values()];
  }
}

function toResult(
  networkCode: string,
  windowFrom: string,
  source: "cache" | "remote",
  samples: AnalysisSample[],
): GetNetworkAnalysesResult {
  return {
    networkCode,
    windowFrom,
    source,
    latestSample: latestSample(samples),
    latestMeasurements: latestMeasurementsByParameter(samples),
  };
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
