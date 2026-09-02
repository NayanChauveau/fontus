import { describe, expect, it } from "vitest";
import { createFakeApplicationPorts } from "../ports/testing/createFakeApplicationPorts";
import { ResolveAddressUseCase } from "./ResolveAddressUseCase";

const bordeaux = {
  id: "33063_8390_00012",
  label: "12 Rue Sainte-Catherine 33000 Bordeaux",
  city: "Bordeaux",
  citycode: "33063",
  longitude: -0.574364,
  latitude: 44.841405,
};

describe("ResolveAddressUseCase", () => {
  it("resolves a selected suggestion to commune + INSEE", async () => {
    const { ports } = createFakeApplicationPorts({
      geocoding: {
        async suggest() {
          return [];
        },
        async resolve(input) {
          expect(input).toEqual({
            id: bordeaux.id,
            label: bordeaux.label,
          });
          return bordeaux;
        },
      },
    });

    const result = await new ResolveAddressUseCase(ports).execute({
      id: ` ${bordeaux.id} `,
      label: ` ${bordeaux.label} `,
    });

    expect(result.address).toEqual(bordeaux);
  });

  it("returns null when the id is missing", async () => {
    let called = false;
    const { ports } = createFakeApplicationPorts({
      geocoding: {
        async suggest() {
          return [];
        },
        async resolve() {
          called = true;
          return bordeaux;
        },
      },
    });

    const result = await new ResolveAddressUseCase(ports).execute({
      id: "  ",
      label: bordeaux.label,
    });

    expect(result.address).toBeNull();
    expect(called).toBe(false);
  });
});
