import { describe, expect, it } from "vitest";
import { SITE_NAME, SITE_ORIGIN } from "./site";

describe("site", () => {
  it("exposes the public origin and brand", () => {
    expect(SITE_ORIGIN).toBe("https://fontus.fr");
    expect(SITE_NAME).toBe("Fontus");
  });
});
