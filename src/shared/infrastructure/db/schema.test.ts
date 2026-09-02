import { describe, expect, it } from "vitest";
import * as schema from "./schema";

describe("db schema", () => {
  it("exposes the persisted tables", () => {
    expect(schema.parameters).toBeDefined();
    expect(schema.measurements).toBeDefined();
    expect(schema.samples).toBeDefined();
    expect(schema.udis).toBeDefined();
  });
});
