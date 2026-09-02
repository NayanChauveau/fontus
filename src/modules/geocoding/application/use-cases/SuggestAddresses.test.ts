import { describe, expect, it } from "vitest";
import { SuggestAddresses } from "./SuggestAddresses";

describe("SuggestAddresses", () => {
  it("asks the gateway for autocomplete results", async () => {
    const requested: unknown[] = [];
    const useCase = new SuggestAddresses({
      async search(query, options) {
        requested.push({ query, options });
        return [
          {
            sourceId: "id-1",
            label: "12 rue Sainte-Catherine 33000 Bordeaux",
            city: "Bordeaux",
            citycode: "33063",
            longitude: -0.57,
            latitude: 44.84,
          },
        ];
      },
    });

    const result = await useCase.execute("12 rue");
    expect(result).toHaveLength(1);
    expect(requested).toEqual([
      { query: "12 rue", options: { autocomplete: true, limit: 7 } },
    ]);
  });
});
