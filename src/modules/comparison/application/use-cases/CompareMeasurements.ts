import { compareMeasurement } from "../../domain/compareMeasurement";
import type { ComparisonStatus } from "../../domain/compareMeasurement";
import {
  pickStrictThreshold,
  STRICT_REFERENCE_CITATION,
} from "../../domain/pickStrictThreshold";
import type { NormCatalog } from "../../../norms/domain/createNormCatalog";
import type { ThresholdKind } from "../../../norms/domain/ThresholdVersion";
import type { NormCatalogPort } from "../../../norms/application/ports/NormCatalogPort";

export type ComparisonInput = {
  parameterId: string | null;
  canonicalNumericValue: number | null;
  qualifier: "eq" | "lt" | "gt";
  conversion: "identity" | "converted" | "not_convertible" | "not_numeric" | null;
  sampledAt?: string;
};

export type ComparisonDto = {
  status: ComparisonStatus;
  kind: ThresholdKind | "site_metric" | null;
  binding: boolean;
  thresholdLabel: string | null;
  citation: string | null;
  sourceUrl: string | null;
};

export type ComparedMeasurement<T extends ComparisonInput> = T & {
  comparisons: {
    fr: ComparisonDto | null;
    eu: ComparisonDto | null;
    ch: ComparisonDto | null;
    us: ComparisonDto | null;
    strict: ComparisonDto | null;
  };
};

export class CompareMeasurements {
  private hydrated = false;

  constructor(
    private readonly catalog: NormCatalog,
    private readonly store: NormCatalogPort,
  ) {}

  async execute<T extends ComparisonInput>(
    measurements: T[],
  ): Promise<ComparedMeasurement<T>[]> {
    await this.hydrate();

    return measurements.map((measurement) => {
      const at = parseSampledAt(measurement.sampledAt);
      const parameterId = measurement.parameterId;
      const fr =
        parameterId && at
          ? this.catalog.findActive(parameterId, "fr", at)
          : null;
      const eu =
        parameterId && at
          ? this.catalog.findActive(parameterId, "eu", at)
          : null;
      const ch =
        parameterId && at
          ? this.catalog.findActive(parameterId, "ch", at)
          : null;
      const us =
        parameterId && at
          ? this.catalog.findActive(parameterId, "us", at)
          : null;
      const strict = pickStrictThreshold([fr, eu, ch, us]);

      return {
        ...measurement,
        comparisons: {
          fr: toDto(compareMeasurement(measurement, fr), measurement),
          eu: toDto(compareMeasurement(measurement, eu), measurement),
          ch: toDto(compareMeasurement(measurement, ch), measurement),
          us: toDto(compareMeasurement(measurement, us), measurement),
          strict: toStrictDto(
            compareMeasurement(measurement, strict),
            measurement,
          ),
        },
      };
    });
  }

  private async hydrate() {
    if (this.hydrated) {
      return;
    }
    this.hydrated = true;

    try {
      for (const version of this.catalog.list()) {
        await this.store.persist(version);
      }
      for (const imported of await this.store.list()) {
        this.catalog.add(imported);
      }
    } catch {
      // Dictionary persistence is an optimization.
    }
  }
}

function parseSampledAt(iso: string | undefined): Date | null {
  if (!iso) {
    return new Date();
  }
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toStrictDto(
  result: ReturnType<typeof compareMeasurement>,
  measurement: ComparisonInput,
): ComparisonDto | null {
  const dto = toDto(result, measurement);
  if (!dto || dto.status === "no_threshold") {
    return dto;
  }
  return {
    ...dto,
    kind: "site_metric",
    binding: false,
    citation: STRICT_REFERENCE_CITATION,
    sourceUrl: null,
  };
}

function toDto(
  result: ReturnType<typeof compareMeasurement>,
  measurement: ComparisonInput,
): ComparisonDto | null {
  if (!result.threshold && result.status === "no_threshold") {
    return {
      status: "no_threshold",
      kind: null,
      binding: false,
      thresholdLabel: null,
      citation: null,
      sourceUrl: null,
    };
  }

  const threshold = result.threshold;
  return {
    status: result.status,
    kind: threshold?.kind ?? null,
    binding: threshold?.binding ?? false,
    thresholdLabel: threshold
      ? formatComparison(measurement, threshold)
      : null,
    citation: threshold?.citation ?? null,
    sourceUrl: threshold?.sourceUrl ?? null,
  };
}

function formatComparison(
  measurement: ComparisonInput,
  threshold: {
    operator: "lte" | "gte" | "range";
    value: number;
    valueMax: number | null;
    unit: string;
  },
): string {
  const limit = formatLimit(threshold);
  const measured = formatMeasured(measurement);
  return measured ? `${measured} / ${limit}` : limit;
}

function formatMeasured(measurement: ComparisonInput): string | null {
  if (
    measurement.canonicalNumericValue === null ||
    !Number.isFinite(measurement.canonicalNumericValue)
  ) {
    return null;
  }
  const prefix =
    measurement.qualifier === "lt"
      ? "< "
      : measurement.qualifier === "gt"
        ? "> "
        : "";
  return `${prefix}${formatNumber(measurement.canonicalNumericValue)}`;
}

function formatLimit(threshold: {
  operator: "lte" | "gte" | "range";
  value: number;
  valueMax: number | null;
  unit: string;
}): string {
  const unit = threshold.unit;
  if (threshold.operator === "range") {
    return `${formatNumber(threshold.value)}–${formatNumber(threshold.valueMax ?? threshold.value)} ${unit}`;
  }
  if (threshold.operator === "gte") {
    return `min. ${formatNumber(threshold.value)} ${unit}`;
  }
  return `${formatNumber(threshold.value)} ${unit}`;
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 6 }).format(
    value,
  );
}
