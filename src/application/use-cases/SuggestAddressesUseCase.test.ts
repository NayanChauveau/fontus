import { describe, expect, it } from "vitest";
import { ApplicationError } from "../errors/ApplicationError";
import { createFakeApplicationPorts } from "../ports/testing/createFakeApplicationPorts";
import { SuggestAddressesUseCase } from "./SuggestAddressesUseCase";

const bordeaux = {
  id: "33063_8390_00012",
  label: "12 Rue Sainte-Catherine 33000 Bordeaux",
  city: "Bordeaux",
  citycode: "33063",
  longitude: -0.574364,
  latitude: 44.841405,
};

describe("SuggestAddressesUseCase", () => {
  it("returns empty suggestions below 3 characters without calling GeoPF", async () => {
    let called = false;
    const { ports } = createFakeApplicationPorts({
      geocoding: {
        async suggest() {
          called = true;
          return [bordeaux];
        },
        async resolve() {
          return null;
        },
      },
    });

    const result = await new SuggestAddressesUseCase(ports).execute("12");

    expect(result.suggestions).toEqual([]);
    expect(called).toBe(false);
  });

  it("returns mapped suggestions for a usable query", async () => {
    const { ports } = createFakeApplicationPorts({
      geocoding: {
        async suggest(query) {
          expect(query).toBe("12 rue X, Bordeaux");
          return [bordeaux];
        },
        async resolve() {
          return null;
        },
      },
    });

    const result = await new SuggestAddressesUseCase(ports).execute(
      "  12 rue X, Bordeaux  ",
    );

    expect(result.suggestions).toEqual([bordeaux]);
  });

  it("propagates GEOCODING_UNAVAILABLE", async () => {
    const { ports } = createFakeApplicationPorts({
      geocoding: {
        async suggest() {
          throw new ApplicationError("GEOCODING_UNAVAILABLE");
        },
        async resolve() {
          return null;
        },
      },
    });

    await expect(
      new SuggestAddressesUseCase(ports).execute("Bordeaux"),
    ).rejects.toMatchObject({ code: "GEOCODING_UNAVAILABLE" });
  });
});
