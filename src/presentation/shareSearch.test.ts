import { describe, expect, it } from "vitest";
import { buildShareSearch, parseShareSearch } from "./shareSearch";

describe("shareSearch", () => {
  it("parses a commune and a network from the query string", () => {
    expect(parseShareSearch("?insee=33063&udi=033001214")).toEqual({
      citycode: "33063",
      networkCode: "033001214",
    });
    expect(parseShareSearch("insee=2a004")).toEqual({
      citycode: "2A004",
      networkCode: null,
    });
  });

  it("ignores invalid or orphan identifiers", () => {
    expect(parseShareSearch("?insee=33&udi=033001214")).toEqual({
      citycode: null,
      networkCode: null,
    });
    expect(parseShareSearch("?udi=033001214")).toEqual({
      citycode: null,
      networkCode: null,
    });
    expect(parseShareSearch("?insee=33063&udi=paulin")).toEqual({
      citycode: "33063",
      networkCode: null,
    });
  });

  it("builds a stable share query", () => {
    expect(
      buildShareSearch({ citycode: "33063", networkCode: "033001214" }),
    ).toBe("insee=33063&udi=033001214");
    expect(buildShareSearch({ citycode: "2a004", networkCode: null })).toBe(
      "insee=2A004",
    );
    expect(buildShareSearch({ citycode: null, networkCode: "033001214" })).toBe(
      "",
    );
    expect(
      buildShareSearch({ citycode: "33063", networkCode: "nope" }),
    ).toBe("insee=33063");
    expect(parseShareSearch("?insee=")).toEqual({
      citycode: null,
      networkCode: null,
    });
  });
});
