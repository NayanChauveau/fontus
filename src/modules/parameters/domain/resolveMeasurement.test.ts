import { describe, expect, it } from "vitest";
import { createParameterCatalog } from "./createParameterCatalog";
import { PRIORITY_PARAMETERS } from "./priorityCatalog";
import { compareResolvedPriority, resolveMeasurement } from "./resolveMeasurement";

describe("resolveMeasurement", () => {
  const catalog = createParameterCatalog(PRIORITY_PARAMETERS);

  it("maps two Hub’Eau labels / codes of the same substance to one canonical id", () => {
    const fromSandre = resolveMeasurement(catalog, {
      parameterCode: "1340",
      parameterLabel: "Nitrates (en NO3)",
      numericValue: 12.3,
      unit: "mg/L",
    });
    const fromSise = resolveMeasurement(catalog, {
      parameterCode: "unknown",
      parameterLabel: "Nitrates",
      siseCode: "NO3",
      numericValue: 12.3,
      unit: "mg/L",
    });

    expect(fromSandre?.parameter.id).toBe("nitrates");
    expect(fromSise?.parameter.id).toBe("nitrates");
    expect(fromSandre?.parameter.id).toBe(fromSise?.parameter.id);
  });

  it("resolves aluminium via SANDRE or SISE to the same id", () => {
    const sandre = resolveMeasurement(catalog, {
      parameterCode: "1370",
      parameterLabel: "Aluminium total µg/l",
      numericValue: 5,
      unit: "µg/L",
    });
    const sise = resolveMeasurement(catalog, {
      parameterCode: "other",
      parameterLabel: "Aluminium",
      siseCode: "ALTMICR",
      numericValue: 0.005,
      unit: "mg/L",
    });

    expect(sandre?.parameter.id).toBe("aluminium");
    expect(sise?.parameter.id).toBe("aluminium");
    expect(sise?.conversion).toBe("converted");
    expect(sise?.canonicalNumericValue).toBe(5);
    expect(sise?.canonicalUnit).toBe("µg/L");
  });

  it("resolves via CAS and returns null when nothing matches", () => {
    const fromCas = resolveMeasurement(catalog, {
      parameterCode: "unknown",
      parameterLabel: "PFOA",
      casCode: "335-67-1",
      numericValue: 0.001,
      unit: "µg/L",
    });
    expect(fromCas?.parameter.id).toBeTruthy();

    expect(
      resolveMeasurement(catalog, {
        parameterCode: "nope",
        parameterLabel: "Inconnu",
        numericValue: 1,
        unit: "mg/L",
      }),
    ).toBeNull();
  });

  it("orders equal priorities by French name", () => {
    expect(
      compareResolvedPriority({ displayPriority: 1, name: "B" }, {
        displayPriority: 1,
        name: "A",
      }),
    ).toBeGreaterThan(0);
  });
});
