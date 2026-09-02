import type { UnitConversionStatus } from "../../domain/convertUnit";
import {
  createUnlistedParameter,
  type ParameterCatalog,
  type SeenParameterCode,
} from "../../domain/createParameterCatalog";
import type { ParameterCategory } from "../../domain/Parameter";
import {
  reconstructPfas20,
  type Pfas20Derivation,
} from "../../domain/reconstructPfas20";
import {
  compareResolvedPriority,
  resolveMeasurement,
} from "../../domain/resolveMeasurement";
import type { ParameterCatalogPort } from "../ports/ParameterCatalogPort";

export type MeasurementInput = {
  parameterCode: string;
  parameterLabel: string;
  siseCode?: string | null;
  casCode?: string | null;
  rawText: string;
  numericValue: number | null;
  qualifier: "eq" | "lt" | "gt";
  unit: string | null;
  sampledAt?: string;
};

export type MeasurementResolution = {
  canonicalId: string;
  canonicalName: string;
  category: ParameterCategory;
  displayPriority: number;
  canonicalUnit: string | null;
  canonicalNumericValue: number | null;
  conversion: UnitConversionStatus;
  derived?: Pfas20Derivation | null;
};

export type ResolvedMeasurementOutput = MeasurementInput & {
  resolution: MeasurementResolution | null;
};

export class ResolveMeasurements {
  private hydrated = false;

  constructor(
    private readonly catalog: ParameterCatalog,
    private readonly store: ParameterCatalogPort,
  ) {}

  async execute(
    measurements: MeasurementInput[],
  ): Promise<ResolvedMeasurementOutput[]> {
    await this.hydrate();
    await this.importMissing(toSeen(measurements), measurements);

    const resolved = measurements.map((measurement) => {
      const match = resolveMeasurement(this.catalog, measurement);
      if (!match) {
        return { ...measurement, resolution: null };
      }

      return {
        ...measurement,
        resolution: {
          canonicalId: match.parameter.id,
          canonicalName: match.parameter.name,
          category: match.parameter.category,
          displayPriority: match.parameter.displayPriority,
          canonicalUnit: match.canonicalUnit,
          canonicalNumericValue: match.canonicalNumericValue,
          conversion: match.conversion,
        },
      };
    });

    return reconstructPfas20(resolved).sort((left, right) =>
      compareResolvedPriority(
        {
          displayPriority: left.resolution?.displayPriority ?? 9999,
          name: left.resolution?.canonicalName ?? left.parameterLabel,
        },
        {
          displayPriority: right.resolution?.displayPriority ?? 9999,
          name: right.resolution?.canonicalName ?? right.parameterLabel,
        },
      ),
    );
  }

  private async hydrate() {
    if (this.hydrated) {
      return;
    }
    this.hydrated = true;

    try {
      for (const parameter of this.catalog.list()) {
        await this.store.persist(parameter);
      }
      for (const imported of await this.store.listImported()) {
        const code = imported.aliases[0]?.externalCode;
        if (code && !this.catalog.findByExternalCode(code)) {
          this.catalog.add(imported);
        }
      }
      await this.importMissing(await this.store.listSeenCodes());
    } catch {
      // Dictionary persistence is an optimization.
    }
  }

  private async importMissing(
    seen: SeenParameterCode[],
    measurements: MeasurementInput[] = [],
  ) {
    const extras = new Map(
      measurements.map((measurement) => [measurement.parameterCode, measurement]),
    );

    for (const row of seen) {
      const measurement = extras.get(row.code);
      if (
        this.catalog.findByExternalCode(row.code) ||
        (measurement?.siseCode &&
          this.catalog.findByExternalCode(measurement.siseCode)) ||
        (measurement?.casCode &&
          this.catalog.findByExternalCode(measurement.casCode))
      ) {
        continue;
      }
      const created = createUnlistedParameter(row);
      this.catalog.add(created);
      try {
        await this.store.persist(created);
      } catch {
        // Keep the in-memory entry even if Postgres is down.
      }
    }
  }
}

function toSeen(measurements: MeasurementInput[]): SeenParameterCode[] {
  return measurements.map((measurement) => ({
    code: measurement.parameterCode,
    label: measurement.parameterLabel,
    unit: measurement.unit,
  }));
}
