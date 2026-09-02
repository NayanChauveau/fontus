import { describe, expect, it } from "vitest";
import { ApplicationError, isApplicationError } from "./ApplicationError";

describe("ApplicationError", () => {
  it("is recognized only as itself", () => {
    expect(isApplicationError(new ApplicationError("ANALYSES_UNAVAILABLE"))).toBe(
      true,
    );
    expect(isApplicationError(new Error("nope"))).toBe(false);
  });
});
