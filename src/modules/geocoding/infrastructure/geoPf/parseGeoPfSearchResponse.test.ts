import { describe, expect, it } from "vitest";
import { parseGeoPfSearchResponse } from "./parseGeoPfSearchResponse";

const bordeauxSearch = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      geometry: { type: "Point", coordinates: [-0.574364, 44.841405] },
      properties: {
        label: "12 Rue Sainte-Catherine 33000 Bordeaux",
        id: "33063_8390_00012",
        city: "Bordeaux",
        citycode: "33063",
      },
    },
    {
      type: "Feature",
      geometry: { type: "Point", coordinates: [2.35, 48.85] },
      properties: {
        label: "POI sans commune",
        id: "poi-1",
      },
    },
  ],
};

describe("parseGeoPfSearchResponse", () => {
  it("keeps only address features with INSEE + coordinates", () => {
    expect(parseGeoPfSearchResponse(bordeauxSearch)).toEqual([
      {
        sourceId: "33063_8390_00012",
        label: "12 Rue Sainte-Catherine 33000 Bordeaux",
        city: "Bordeaux",
        citycode: "33063",
        longitude: -0.574364,
        latitude: 44.841405,
      },
    ]);
  });

  it("returns empty on a malformed payload", () => {
    expect(parseGeoPfSearchResponse(null)).toEqual([]);
    expect(parseGeoPfSearchResponse({ type: "Error" })).toEqual([]);
  });
});
