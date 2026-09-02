import { describe, expect, it } from "vitest";
import { createFakeApplicationPorts } from "./createFakeApplicationPorts";

describe("createFakeApplicationPorts", () => {
  it("exposes default no-op ports", async () => {
    const { ports } = createFakeApplicationPorts();
    expect(await ports.analyses.getByNetworkCode("033001214")).toMatchObject({
      latestSample: null,
    });
    expect(await ports.geocoding.suggest("abc")).toEqual([]);
    expect(await ports.geocoding.resolve({ id: "1", label: "abc" })).toBeNull();
    expect(await ports.parameters.resolve([])).toEqual([]);
    expect((await ports.network.listByCitycode("33063")).confidence).toBe(
      "none",
    );
  });
});
