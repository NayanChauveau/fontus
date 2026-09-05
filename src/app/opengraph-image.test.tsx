import { describe, expect, it, vi } from "vitest";

vi.mock("next/og", () => ({
  ImageResponse: class ImageResponse {
    constructor(
      readonly element: unknown,
      readonly init: unknown,
    ) {}
  },
}));

describe("opengraph-image", () => {
  it("exports a 1200x630 card", async () => {
    const image = await import("./opengraph-image");
    expect(image.size).toEqual({ width: 1200, height: 630 });
    expect(image.contentType).toBe("image/png");
    expect(image.alt).toMatch(/eau du robinet/i);
    expect(image.default()).toBeInstanceOf(Object);
  });
});
