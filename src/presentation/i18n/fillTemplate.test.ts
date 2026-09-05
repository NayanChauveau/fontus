import { describe, expect, it } from "vitest";
import { fillTemplate } from "./fillTemplate";

describe("fillTemplate", () => {
  it("replaces placeholders", () => {
    expect(fillTemplate("Limite : {{value}}.", { value: "50 mg/L" })).toBe(
      "Limite : 50 mg/L.",
    );
  });
});
