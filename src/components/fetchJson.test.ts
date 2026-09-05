import { describe, expect, it, vi } from "vitest";
import { fetchJson } from "./fetchJson";

describe("fetchJson", () => {
  it("returns the payload when the response is ok", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ city: "Lyon" })),
    );
    await expect(fetchJson<{ city: string }>("/api/x", undefined)).resolves.toEqual(
      { city: "Lyon" },
    );
    vi.unstubAllGlobals();
  });

  it("throws when the response is an error payload", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ error: "nope" }, { status: 503 })),
    );
    await expect(fetchJson("/api/x", undefined)).rejects.toThrow("UNAVAILABLE");
    vi.unstubAllGlobals();
  });
});
