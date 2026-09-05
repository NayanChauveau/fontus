import { describe, expect, it, vi } from "vitest";

const cookieValue = { current: undefined as string | undefined };

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: () =>
      cookieValue.current ? { value: cookieValue.current } : undefined,
  }),
}));

describe("requestLocale", () => {
  it("defaults to french and reads the locale cookie", async () => {
    const { requestLocale, requestMessages } = await import("./requestLocale");
    cookieValue.current = undefined;
    await expect(requestLocale()).resolves.toBe("fr");
    await expect(requestMessages()).resolves.toMatchObject({
      home: { metaTitle: "Qualité de l’eau du robinet en France" },
    });

    cookieValue.current = "en";
    await expect(requestLocale()).resolves.toBe("en");
    await expect(requestMessages()).resolves.toMatchObject({
      home: { metaTitle: "Tap water quality in France" },
    });
  });
});
