import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApplicationError } from "@/application/errors/ApplicationError";

const execute = vi.fn();

vi.mock("@/composition/bootstrap", () => ({
  ensureApplication: () => ({
    resolveAddressUseCase: { execute },
  }),
}));

describe("POST /api/addresses/resolve", () => {
  beforeEach(() => {
    execute.mockReset();
  });

  it("resolves a valid body", async () => {
    execute.mockResolvedValueOnce({ address: null });
    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/addresses/resolve", {
        method: "POST",
        body: JSON.stringify({ id: "1", label: "Bordeaux" }),
      }),
    );
    expect(response.status).toBe(200);
    expect(execute).toHaveBeenCalledWith({ id: "1", label: "Bordeaux" });
  });

  it("accepts invalid JSON as empty fields", async () => {
    execute.mockResolvedValueOnce({ address: null });
    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/addresses/resolve", {
        method: "POST",
        body: "not-json",
      }),
    );
    expect(response.status).toBe(200);
    expect(execute).toHaveBeenCalledWith({ id: "", label: "" });
  });

  it("maps application errors to 503", async () => {
    execute.mockRejectedValueOnce(new ApplicationError("GEOCODING_UNAVAILABLE"));
    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/addresses/resolve", {
        method: "POST",
        body: JSON.stringify({ id: 1, label: 2 }),
      }),
    );
    expect(response.status).toBe(503);
  });

  it("rethrows unexpected errors", async () => {
    execute.mockRejectedValueOnce(new Error("boom"));
    const { POST } = await import("./route");
    await expect(
      POST(
        new Request("http://localhost/api/addresses/resolve", {
          method: "POST",
          body: "{}",
        }),
      ),
    ).rejects.toThrow("boom");
  });
});
