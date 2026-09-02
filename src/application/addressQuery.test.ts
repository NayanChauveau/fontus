import { describe, expect, it } from "vitest";
import {
  isAddressQueryTooShort,
  normalizeAddressQuery,
} from "./addressQuery";

describe("addressQuery", () => {
  it("trims, collapses spaces and caps length", () => {
    expect(normalizeAddressQuery("  12   rue  ")).toBe("12 rue");
    expect(normalizeAddressQuery("x".repeat(250)).length).toBe(200);
  });

  it("rejects queries shorter than 3 characters", () => {
    expect(isAddressQueryTooShort("ab")).toBe(true);
    expect(isAddressQueryTooShort("abc")).toBe(false);
  });
});
