import { describe, expect, it } from "vitest";
import { resolveBannerTone } from "./resolveBannerTone";

describe("resolveBannerTone", () => {
  it("privileges coded limit fields over a mention of quality references", () => {
    expect(
      resolveBannerTone({
        conclusion:
          "Eau conforme aux limites, non conforme aux références de qualité",
        conformiteLimitesBact: "C",
        conformiteLimitesPc: "C",
      }),
    ).toBe("ok");
    expect(
      resolveBannerTone({
        conclusion: "Eau d'alimentation conforme.",
        conformiteLimitesBact: "N",
        conformiteLimitesPc: "C",
      }),
    ).toBe("alert");
  });

  it("falls back to the official sentence when codes are missing", () => {
    expect(
      resolveBannerTone({
        conclusion: "Eau non conforme",
        conformiteLimitesBact: null,
        conformiteLimitesPc: null,
      }),
    ).toBe("alert");
    expect(
      resolveBannerTone({
        conclusion: "Eau conforme",
        conformiteLimitesBact: null,
        conformiteLimitesPc: null,
      }),
    ).toBe("ok");
    expect(
      resolveBannerTone({
        conclusion: null,
        conformiteLimitesBact: null,
        conformiteLimitesPc: null,
      }),
    ).toBe("neutral");
  });
});
