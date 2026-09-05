import { describe, expect, it } from "vitest";
import { SITE_NAME, SITE_ORIGIN, SUPPORT_URL } from "./site";

describe("site", () => {
  it("exposes the public origin and brand", () => {
    expect(SITE_ORIGIN).toBe("https://fontus.fr");
    expect(SITE_NAME).toBe("Fontus");
    expect(SUPPORT_URL).toBe("https://buymeacoffee.com/nayanchauvg");
  });
});
