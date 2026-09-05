import { describe, expect, it } from "vitest";
import {
  buildShareSearch,
  firstSearchParam,
  hasShareQueryParams,
  parseSharePath,
  parseShareSearch,
  pathForShare,
} from "./shareSearch";

describe("shareSearch", () => {
  it("parses a commune and a network from the query string", () => {
    expect(parseShareSearch("?insee=33063&udi=033001214")).toEqual({
      citycode: "33063",
      networkCode: "033001214",
      addressLabel: null,
    });
    expect(parseShareSearch("insee=2a004")).toEqual({
      citycode: "2A004",
      networkCode: null,
      addressLabel: null,
    });
  });

  it("ignores invalid or orphan identifiers", () => {
    expect(parseShareSearch("?insee=33&udi=033001214")).toEqual({
      citycode: null,
      networkCode: null,
      addressLabel: null,
    });
    expect(parseShareSearch("?udi=033001214")).toEqual({
      citycode: null,
      networkCode: null,
      addressLabel: null,
    });
    expect(parseShareSearch("?insee=33063&udi=paulin")).toEqual({
      citycode: "33063",
      networkCode: null,
      addressLabel: null,
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
      addressLabel: null,
    });
    expect(
      parseShareSearch(
        "?insee=31555&adresse=55+Avenue+Pierre+Molette+31100+Toulouse",
      ),
    ).toEqual({
      citycode: "31555",
      networkCode: null,
      addressLabel: "55 Avenue Pierre Molette 31100 Toulouse",
    });
  });

  it("detects share query params even when they are invalid", () => {
    expect(firstSearchParam(undefined)).toBeNull();
    expect(firstSearchParam("")).toBeNull();
    expect(firstSearchParam([])).toBeNull();
    expect(firstSearchParam(["81004"])).toBe("81004");
    expect(hasShareQueryParams({})).toBe(false);
    expect(hasShareQueryParams({ insee: "" })).toBe(false);
    expect(hasShareQueryParams({ insee: "81004" })).toBe(true);
    expect(hasShareQueryParams({ udi: "081004110" })).toBe(true);
    expect(hasShareQueryParams({ insee: "xx" })).toBe(true);
  });

  it("reuses city pages for catalog communes", () => {
    expect(pathForShare({ citycode: "31555", networkCode: null })).toBe(
      "/eau-robinet/toulouse",
    );
    expect(
      pathForShare({ citycode: "31555", networkCode: "031000006" }),
    ).toBe("/eau-robinet/toulouse/031000006");
    expect(pathForShare({ citycode: "81004", networkCode: null })).toBe(
      "/?insee=81004",
    );
    expect(pathForShare({ citycode: null, networkCode: null })).toBe("/");
    expect(pathForShare({ citycode: "75108", networkCode: null })).toBe(
      "/eau-robinet/paris",
    );
    expect(
      pathForShare({
        citycode: "31555",
        networkCode: null,
        addressLabel: "55 Avenue Pierre Molette 31100 Toulouse",
      }),
    ).toBe(
      "/eau-robinet/toulouse?adresse=55+Avenue+Pierre+Molette+31100+Toulouse",
    );
    expect(
      pathForShare({
        citycode: "31555",
        networkCode: null,
        addressLabel: "Toulouse",
      }),
    ).toBe("/eau-robinet/toulouse");
  });

  it("reads a catalog city from the pretty path", () => {
    expect(parseSharePath("/eau-robinet/toulouse")).toEqual({
      citycode: "31555",
      networkCode: null,
      addressLabel: null,
    });
    expect(parseSharePath("/eau-robinet/toulouse/031000006")).toEqual({
      citycode: "31555",
      networkCode: "031000006",
      addressLabel: null,
    });
    expect(parseSharePath("/")).toBeNull();
  });
});

