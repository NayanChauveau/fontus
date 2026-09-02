import { describe, expect, it } from "vitest";
import { mapAddressDtoToViewModel } from "./mapAddressDto";

describe("mapAddressDtoToViewModel", () => {
  it("formats coordinates with 6 decimals", () => {
    const viewModel = mapAddressDtoToViewModel({
      id: "1",
      label: "12 rue Sainte-Catherine 33000 Bordeaux",
      city: "Bordeaux",
      citycode: "33063",
      longitude: -0.574364,
      latitude: 44.841405,
    });
    expect(viewModel.coordinates).toBe("44.841405, -0.574364");
  });
});
