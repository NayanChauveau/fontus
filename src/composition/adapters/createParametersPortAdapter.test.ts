import { describe, expect, it } from "vitest";
import { ApplicationError } from "@/application/errors/ApplicationError";
import { createParametersPortAdapter } from "./createParametersPortAdapter";

describe("createParametersPortAdapter", () => {
  it("maps resolved measurements", async () => {
    const adapter = createParametersPortAdapter({
      resolveMeasurements: {
        async execute(measurements: never[]) {
          return measurements;
        },
      } as never,
    });

    const input = [
      {
        parameterCode: "1340",
        parameterLabel: "Nitrates",
        rawText: "6",
        numericValue: 6,
        qualifier: "eq" as const,
        unit: "mg/L",
        sampledAt: "2026-06-18T11:40:00.000Z",
        resolution: null,
      },
    ];
    expect(await adapter.resolve(input)).toEqual(input);
  });

  it("wraps module failures", async () => {
    const adapter = createParametersPortAdapter({
      resolveMeasurements: {
        async execute() {
          throw new Error("down");
        },
      } as never,
    });

    await expect(adapter.resolve([])).rejects.toBeInstanceOf(ApplicationError);
  });
});
