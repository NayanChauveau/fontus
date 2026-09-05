import { describe, expect, it } from "vitest";
import {
  createParameterCatalog,
  createUnlistedParameter,
} from "./createParameterCatalog";
import { PRIORITY_PARAMETERS } from "./priorityCatalog";

describe("createParameterCatalog", () => {
  it("keeps a seed alias when an imported parameter reuses the same code", () => {
    const catalog = createParameterCatalog(PRIORITY_PARAMETERS);
    const imported = createUnlistedParameter({
      code: "1340",
      label: "Nitrates importés",
      unit: "mg/L",
    });

    catalog.add(imported);

    expect(catalog.findByExternalCode("1340")?.origin).toBe("seed");
    expect(catalog.findByExternalCode("1340")?.id).toBe("nitrates");
    expect(catalog.findByExternalCode("1391")?.id).toBe("fluoride");
    expect(catalog.findByExternalCode("1371")?.id).toBe("chromium6");
    expect(catalog.list().some((parameter) => parameter.id === imported.id)).toBe(
      true,
    );
  });
});
