import { describe, expect, it } from "vitest";
import { createPersistOptions, shouldPersistQuery } from "./queryPersist";
import { queryKeys } from "./queryKeys";

describe("queryPersist", () => {
  it("persists only successful network and quality queries", () => {
    expect(
      shouldPersistQuery({
        queryKey: queryKeys.networks("31555"),
        state: { status: "success" },
      } as never),
    ).toBe(true);
    expect(
      shouldPersistQuery({
        queryKey: queryKeys.quality("033001214"),
        state: { status: "success" },
      } as never),
    ).toBe(true);
    expect(
      shouldPersistQuery({
        queryKey: queryKeys.networks("31555"),
        state: { status: "error" },
      } as never),
    ).toBe(false);
    expect(
      shouldPersistQuery({
        queryKey: ["addresses", "lyon"],
        state: { status: "success" },
      } as never),
    ).toBe(false);
  });

  it("builds persist options for the browser cache", () => {
    const options = createPersistOptions();
    expect(options.maxAge).toBeGreaterThan(0);
    expect(options.persister).toBeTruthy();
  });
});
