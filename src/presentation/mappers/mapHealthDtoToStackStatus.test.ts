import { describe, expect, it } from "vitest";
import { mapHealthDtoToStackStatus } from "./mapHealthDtoToStackStatus";

describe("mapHealthDtoToStackStatus", () => {
  it("is ok only when status and postgres are both good", () => {
    expect(
      mapHealthDtoToStackStatus({
        status: "ok",
        postgres: true,
        schema: true,
        detail: null,
        checkedAt: "2026-09-02T08:00:00.000Z",
      }).stackOk,
    ).toBe(true);
    expect(
      mapHealthDtoToStackStatus({
        status: "ok",
        postgres: true,
        schema: false,
        detail: "Table udis is missing.",
        checkedAt: "2026-09-02T08:00:00.000Z",
      }).stackOk,
    ).toBe(false);
  });
});
