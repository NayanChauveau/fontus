import { describe, expect, it } from "vitest";
import { isNetworkCode, normalizeNetworkCode } from "./networkCode";

describe("networkCode", () => {
  it("accepts 9-digit UDI codes only", () => {
    expect(isNetworkCode("033001214")).toBe(true);
    expect(isNetworkCode("paulin")).toBe(false);
  });

  it("trims the code", () => {
    expect(normalizeNetworkCode(" 033001214 ")).toBe("033001214");
  });
});
