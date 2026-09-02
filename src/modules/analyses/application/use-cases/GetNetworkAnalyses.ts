import {
  latestMeasurementsByParameter,
  latestSample,
  isFreshAnalysisSync,
  HUBEAU_ROW_HARD_CAP,
  HUBEAU_ROW_SOFT_CAP,
  type AnalysisSample,
  type ParameterSnapshot,
} from "../../domain/Analysis";
import { extractHistorySnapshots } from "../../domain/extractHistorySnapshots";
import {
  ANALYSIS_WINDOW_MONTHS,
  chooseAnalysisWindow,
  windowFromDate,
} from "../../domain/chooseAnalysisWindow";
import type { AnalysesCachePort } from "../ports/AnalysesCachePort";
import {
  emptyDisImport,
  type DisImportPort,
} from "../ports/DisImportPort";
import type { ResultatsDisGatewayPort } from "../ports/ResultatsDisGatewayPort";

const MAX_PAGES = 20;

export type AnalysesErrorReporter = {
  report(event: {
    level: "info" | "error";
    scope: "analyses";
    event: string;
    cause?: unknown;
    context?: Record<string, string | number | boolean | null | undefined>;
  }): void;
};

export type GetNetworkAnalysesResult = {
  networkCode: string;
  windowFrom: string;
  source: "cache" | "remote" | "import";
  latestSample: AnalysisSample | null;
  latestMeasurements: ParameterSnapshot[];
  historySnapshots: ParameterSnapshot[];
};

export class GetNetworkAnalyses {
  private readonly inflight = new Map<string, Promise<GetNetworkAnalysesResult>>();

  constructor(
    private readonly gateway: ResultatsDisGatewayPort,
    private readonly cache: AnalysesCachePort,
    private readonly now: () => Date = () => new Date(),
    private readonly reporter: AnalysesErrorReporter = { report() {} },
    private readonly disImport: DisImportPort = emptyDisImport,
  ) {}

  async execute(networkCode: string): Promise<GetNetworkAnalysesResult> {
    const running = this.inflight.get(networkCode);
    if (running) {
      return running;
    }

    const pending = this.cache
      .withNetworkLock(networkCode, () => this.load(networkCode))
      .finally(() => {
        this.inflight.delete(networkCode);
      });
    this.inflight.set(networkCode, pending);
    return pending;
  }

  private async load(networkCode: string): Promise<GetNetworkAnalysesResult> {
    const now = this.now();
    const cached = await this.readFresh(networkCode, now);
    if (cached) {
      this.reporter.report({
        level: "info",
        scope: "analyses",
        event: "cache_hit",
        context: { networkCode },
      });
      return toResult(
        networkCode,
        cached.windowFrom,
        "cache",
        cached.samples,
      );
    }

    const window = await this.resolveWindow(networkCode, now);
    if (window.count > HUBEAU_ROW_HARD_CAP) {
      const imported = await this.tryImport(networkCode, window.dateMin);
      if (imported) {
        await this.persist(networkCode, imported, window.dateMin, now);
        this.reporter.report({
          level: "info",
          scope: "analyses",
          event: "dis_import",
          context: {
            networkCode,
            windowFrom: window.dateMin,
            sampleCount: imported.length,
          },
        });
        return toResult(networkCode, window.dateMin, "import", imported);
      }
    }

    const fetched = await this.fetchAllPages(networkCode, window.dateMin);
    if (fetched.complete) {
      await this.persist(networkCode, fetched.samples, window.dateMin, now);
    }

    this.reporter.report({
      level: "info",
      scope: "analyses",
      event: "hubeau_fetch",
      context: {
        networkCode,
        windowFrom: window.dateMin,
        sampleCount: fetched.samples.length,
      },
    });

    return toResult(networkCode, window.dateMin, "remote", fetched.samples);
  }

  private async readFresh(networkCode: string, now: Date) {
    try {
      const cached = await this.cache.read(networkCode);
      if (!cached || !isFreshAnalysisSync(cached.fetchedAt, now)) {
        return null;
      }
      return cached;
    } catch (error) {
      this.reporter.report({
        level: "error",
        scope: "analyses",
        event: "cache_read_failed",
        cause: error,
        context: { networkCode },
      });
      return null;
    }
  }

  private async persist(
    networkCode: string,
    samples: AnalysisSample[],
    windowFrom: string,
    fetchedAt: Date,
  ) {
    if (samples.length === 0) {
      return;
    }
    try {
      await this.cache.write({
        networkCode,
        samples,
        windowFrom,
        fetchedAt,
      });
    } catch (error) {
      this.reporter.report({
        level: "error",
        scope: "analyses",
        event: "cache_write_failed",
        cause: error,
        context: { networkCode },
      });
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
      count: chosen.count,
    };
  }

  private async tryImport(networkCode: string, dateMin: string) {
    try {
      const samples = await this.disImport.listByNetwork(networkCode, dateMin);
      return samples.length > 0 ? samples : null;
    } catch (error) {
      this.reporter.report({
        level: "error",
        scope: "analyses",
        event: "dis_import_failed",
        cause: error,
        context: { networkCode },
      });
      return null;
    }
  }

  private async fetchAllPages(
    networkCode: string,
    dateMin: string,
  ): Promise<{ samples: AnalysisSample[]; complete: boolean }> {
    const merged = new Map<string, AnalysisSample>();
    let next: string | undefined;
    try {
      for (let page = 0; page < MAX_PAGES; page += 1) {
        const result = await this.gateway.listPage(networkCode, dateMin, next);
        mergeSamples(merged, result.samples);
        if (!result.next) {
          return { samples: [...merged.values()], complete: true };
        }
        next = result.next;
      }
      return { samples: [...merged.values()], complete: false };
    } catch (error) {
      if (merged.size === 0) {
        throw error;
      }
      return { samples: [...merged.values()], complete: false };
    }
  }
}

function toResult(
  networkCode: string,
  windowFrom: string,
  source: "cache" | "remote" | "import",
  samples: AnalysisSample[],
): GetNetworkAnalysesResult {
  return {
    networkCode,
    windowFrom,
    source,
    latestSample: latestSample(samples),
    latestMeasurements: latestMeasurementsByParameter(samples),
    historySnapshots: extractHistorySnapshots(samples),
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
