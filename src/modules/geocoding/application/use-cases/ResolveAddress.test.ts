import { describe, expect, it } from "vitest";
import { ResolveAddress } from "./ResolveAddress";

const candidate = {
  sourceId: "id-1",
  label: "12 rue Sainte-Catherine 33000 Bordeaux",
  city: "Bordeaux",
  citycode: "33063",
  longitude: -0.57,
  latitude: 44.84,
};

describe("ResolveAddress", () => {
  it("returns the matching candidate or null", async () => {
    const useCase = new ResolveAddress({
      async search() {
        return [candidate];
      },
    });

    expect(await useCase.execute({ id: "id-1", label: candidate.label })).toEqual(
      candidate,
    );
    expect(
      await useCase.execute({ id: "missing", label: candidate.label }),
    ).toBeNull();
  });
});
