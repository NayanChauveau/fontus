import { describe, expect, it } from "vitest";
import { EDITORIAL_PATHS, FAQ_PATH } from "./paths";

describe("editorial paths", () => {
  it("lists the six public editorial routes", () => {
    expect(EDITORIAL_PATHS).toHaveLength(6);
    expect(EDITORIAL_PATHS).toContain(FAQ_PATH);
  });
});
