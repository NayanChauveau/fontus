import { describe, expect, it } from "vitest";
import { resolveCommuneInsee } from "./resolveCommuneInsee";

describe("resolveCommuneInsee", () => {
  it("maps Paris, Marseille and Lyon arrondissements to the commune INSEE", () => {
    expect(resolveCommuneInsee("75112")).toBe("75056");
    expect(resolveCommuneInsee("13204")).toBe("13055");
    expect(resolveCommuneInsee("69381")).toBe("69123");
  });

  it("leaves ordinary commune codes unchanged", () => {
    expect(resolveCommuneInsee("33063")).toBe("33063");
    expect(resolveCommuneInsee("13055")).toBe("13055");
  });
});
