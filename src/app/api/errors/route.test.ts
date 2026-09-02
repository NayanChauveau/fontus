import { beforeEach, describe, expect, it, vi } from "vitest";

const reportError = vi.fn();
const consumeRateLimit = vi.fn(async () => true);

vi.mock("@/composition/bootstrap", () => ({
  ensureApplication: () => ({ reportError, consumeRateLimit }),
}));

describe("POST /api/errors", () => {
  beforeEach(() => {
    reportError.mockReset();
    consumeRateLimit.mockReset();
    consumeRateLimit.mockResolvedValue(true);
  });

  it("records a client error", async () => {
    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/errors", {
        method: "POST",
        body: JSON.stringify({
          scope: "ui",
          event: "app_error",
          message: "Render failed",
          digest: "abc",
        }),
      }),
    );
    expect(response.status).toBe(200);
    expect(reportError).toHaveBeenCalledWith({
      scope: "ui",
      event: "app_error",
      cause: "Render failed",
      context: { digest: "abc" },
    });
  });

  it("rejects an empty or invalid body", async () => {
    const { POST } = await import("./route");
    const invalid = await POST(
      new Request("http://localhost/api/errors", {
        method: "POST",
        body: "nope",
      }),
    );
    const empty = await POST(
      new Request("http://localhost/api/errors", {
        method: "POST",
        body: JSON.stringify({ message: "" }),
      }),
    );
    const notObject = await POST(
      new Request("http://localhost/api/errors", {
        method: "POST",
        body: JSON.stringify(null),
      }),
    );
    expect(invalid.status).toBe(400);
    expect(empty.status).toBe(400);
    expect(notObject.status).toBe(400);
    expect(reportError).not.toHaveBeenCalled();
  });

  it("defaults the scope and event when the client omits them", async () => {
    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/errors", {
        method: "POST",
        body: JSON.stringify({ message: "oops" }),
      }),
    );
    expect(response.status).toBe(200);
    expect(reportError).toHaveBeenCalledWith({
      scope: "ui",
      event: "client_error",
      cause: "oops",
      context: { digest: null },
    });
  });

  it("maps a rate-limit failure", async () => {
    consumeRateLimit.mockResolvedValueOnce(false);
    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/errors", {
        method: "POST",
        body: JSON.stringify({ message: "oops" }),
      }),
    );
    expect(response.status).toBe(429);
  });

  it("rejects an unknown event name", async () => {
    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/errors", {
        method: "POST",
        body: JSON.stringify({ message: "oops", event: "drop-tables" }),
      }),
    );
    expect(response.status).toBe(400);
    expect(reportError).not.toHaveBeenCalled();
  });
});
