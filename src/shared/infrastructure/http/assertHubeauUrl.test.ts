import { describe, expect, it } from "vitest";
import { parseHubeauUrl } from "./assertHubeauUrl";

describe("parseHubeauUrl", () => {
  it("accepts the official host and rejects anything else", () => {
    expect(
      parseHubeauUrl(
        "https://hubeau.eaufrance.fr/api/v1/qualite_eau_potable/resultats_dis?page=2",
      ).hostname,
    ).toBe("hubeau.eaufrance.fr");
    expect(() => parseHubeauUrl("https://hubeau.example/page/2")).toThrow(
      "HUBEAU_UNTRUSTED_NEXT",
    );
    expect(() => parseHubeauUrl("http://hubeau.eaufrance.fr/x")).toThrow(
      "HUBEAU_UNTRUSTED_NEXT",
    );
  });
});
