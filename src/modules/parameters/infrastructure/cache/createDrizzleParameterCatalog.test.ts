import { describe, expect, it } from "vitest";
import { createFakeDb } from "@/test/fakeDb";
import { createDrizzleParameterCatalog } from "./createDrizzleParameterCatalog";

describe("createDrizzleParameterCatalog", () => {
  it("persists a parameter without aliases", async () => {
    const catalog = createDrizzleParameterCatalog(createFakeDb() as never);
    await catalog.persist({
      id: "nitrates",
      name: "Nitrates",
      cas: null,
      category: "nutrients",
      canonicalUnit: "mg/L",
      displayPriority: 20,
      origin: "seed",
      aliases: [],
    });
  });

  it("persists aliases, lists imports and unique seen codes", async () => {
    const catalog = createDrizzleParameterCatalog(
      createFakeDb({
        selectResults: [
          [
            {
              id: "unlisted:1",
              name: "X",
              cas: null,
              category: "unlisted",
              canonicalUnit: "mg/L",
              displayPriority: 1000,
              origin: "import",
            },
          ],
          [
            {
              source: "sandre",
              externalCode: "1",
              label: "X",
              parameterId: "unlisted:1",
            },
            {
              source: "sise",
              externalCode: "X",
              label: "X",
              parameterId: "unlisted:1",
            },
          ],
          [
            { code: "1340", label: "Nitrates", unit: "mg/L" },
            { code: "1340", label: "Nitrates", unit: "mg/L" },
          ],
        ],
      }) as never,
    );

    await catalog.persist({
      id: "nitrates",
      name: "Nitrates",
      cas: null,
      category: "nutrients",
      canonicalUnit: "mg/L",
      displayPriority: 20,
      origin: "seed",
      aliases: [{ source: "sandre", externalCode: "1340", label: "Nitrates" }],
    });

    const imported = await catalog.listImported();
    expect(imported[0]?.aliases).toHaveLength(2);
    expect(await catalog.listSeenCodes()).toEqual([
      { code: "1340", label: "Nitrates", unit: "mg/L" },
    ]);
  });

  it("lists an imported parameter even without aliases", async () => {
    const catalog = createDrizzleParameterCatalog(
      createFakeDb({
        selectResults: [
          [
            {
              id: "orphan",
              name: "Orphelin",
              cas: null,
              category: "unlisted",
              canonicalUnit: null,
              displayPriority: 1000,
              origin: "import",
            },
          ],
          [],
        ],
      }) as never,
    );

    const imported = await catalog.listImported();
    expect(imported[0]?.aliases).toEqual([]);
  });
});
