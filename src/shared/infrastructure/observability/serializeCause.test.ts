import { describe, expect, it } from "vitest";
import { serializeCause } from "./serializeCause";

describe("serializeCause", () => {
  it("walks an Error cause chain and stringifies a primitive", () => {
    const nested = new Error("timeout");
    nested.name = "TimeoutError";
    const wrapped = new Error("HUBEAU_REQUEST_FAILED", { cause: nested });
    const serialized = serializeCause(wrapped);

    expect(serialized.message).toBe("HUBEAU_REQUEST_FAILED");
    expect(serialized.chain).toEqual([
      "HUBEAU_REQUEST_FAILED",
      "TimeoutError: timeout",
    ]);
    expect(serializeCause("down").message).toBe("down");
    expect(serializeCause(null).message).toBe("unknown");
  });

  it("stops a circular cause chain and appends a non-error tail", () => {
    const loop = new Error("loop");
    loop.cause = loop;
    expect(serializeCause(loop).chain).toEqual(["loop"]);

    const tail = new Error("outer", { cause: 42 });
    expect(serializeCause(tail).chain).toEqual(["outer", "42"]);
  });
});
