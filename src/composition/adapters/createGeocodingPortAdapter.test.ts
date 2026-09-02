import { describe, expect, it } from "vitest";
import { ApplicationError } from "@/application/errors/ApplicationError";
import { createGeocodingPortAdapter } from "./createGeocodingPortAdapter";

const candidate = {
  sourceId: "id-1",
  label: "12 rue Sainte-Catherine 33000 Bordeaux",
  city: "Bordeaux",
  citycode: "33063",
  longitude: -0.57,
  latitude: 44.84,
};

describe("createGeocodingPortAdapter", () => {
  it("maps suggestions and resolve matches", async () => {
    const adapter = createGeocodingPortAdapter({
      suggestAddresses: {
        async execute() {
          return [candidate];
        },
      },
      resolveAddress: {
        async execute(input: { id: string; label: string }) {
          return input.id === "id-1" ? candidate : null;
        },
      },
    } as never);

    expect(await adapter.suggest("12 rue")).toEqual([
      {
        id: "id-1",
        label: candidate.label,
        city: "Bordeaux",
        citycode: "33063",
        longitude: -0.57,
        latitude: 44.84,
      },
    ]);
    expect(
      await adapter.resolve({ id: "id-1", label: candidate.label }),
    ).toMatchObject({ id: "id-1" });
    expect(
      await adapter.resolve({ id: "missing", label: candidate.label }),
    ).toBeNull();
  });

  it("wraps gateway failures", async () => {
    const adapter = createGeocodingPortAdapter({
      suggestAddresses: {
        async execute() {
          throw new Error("down");
        },
      },
      resolveAddress: {
        async execute() {
          throw new Error("down");
        },
      },
    } as never);

    await expect(adapter.suggest("abc")).rejects.toBeInstanceOf(ApplicationError);
    await expect(
      adapter.resolve({ id: "1", label: "abcde" }),
    ).rejects.toMatchObject({ code: "GEOCODING_UNAVAILABLE" });
  });
});
