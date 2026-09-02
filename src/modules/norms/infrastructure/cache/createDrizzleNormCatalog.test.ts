import { describe, expect, it } from "vitest";
import { createFakeDb } from "@/test/fakeDb";
import { FR_EU_THRESHOLDS } from "../../domain/frEuCatalog";
import { createDrizzleNormCatalog } from "./createDrizzleNormCatalog";

describe("createDrizzleNormCatalog", () => {
  it("persists a version and lists stored rows", async () => {
    const catalog = createDrizzleNormCatalog(
      createFakeDb({
        selectResults: [
          [
            {
              id: "nitrates:fr",
              parameterId: "nitrates",
              jurisdiction: "fr",
              unit: "mg/L",
              value: "50",
              valueMax: null,
              operator: "lte",
              kind: "legal_limit",
              binding: true,
              validFrom: "2007-01-11",
              validTo: null,
              citation: "arrêté",
              sourceUrl: "https://example.test",
            },
            {
              id: "ph:fr",
              parameterId: "ph",
              jurisdiction: "fr",
              unit: "unité pH",
              value: "6.5",
              valueMax: "9",
              operator: "range",
              kind: "quality_reference",
              binding: false,
              validFrom: "2007-01-11",
              validTo: "2036-01-12",
              citation: "arrêté",
              sourceUrl: "https://example.test",
            },
          ],
        ],
      }) as never,
    );

    const ph = FR_EU_THRESHOLDS.find((row) => row.id === "ph:fr");
    const lead = FR_EU_THRESHOLDS.find((row) => row.id === "lead:fr:10");
    await catalog.persist(FR_EU_THRESHOLDS[0]!);
    if (ph) {
      await catalog.persist(ph);
    }
    if (lead) {
      await catalog.persist(lead);
    }
    const listed = await catalog.list();
    expect(listed[0]?.parameterId).toBe("nitrates");
    expect(listed[1]?.valueMax).toBe(9);
    expect(listed[1]?.validTo?.toISOString()).toContain("2036-01-12");
  });
});
