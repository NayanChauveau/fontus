import { describe, expect, it, vi } from "vitest";

const write = vi.spyOn(console, "error").mockImplementation(() => {});

describe("POST /api/csp-report", () => {
  it("writes one JSON csp violation line through the app's logger, shaped like Manon's", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const { POST, dynamic } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/csp-report", {
        method: "POST",
        body: JSON.stringify({
          "csp-report": {
            "document-uri": "https://fontus.fr/faq",
            "violated-directive": "script-src-elem",
            "blocked-uri": "https://evil.example/x.js",
          },
        }),
      }),
    );
    vi.unstubAllEnvs();
    expect(dynamic).toBe("force-dynamic");
    expect(response.status).toBe(204);
    expect(write).toHaveBeenCalledTimes(1);
    expect(JSON.parse(String(write.mock.calls[0]?.[0]))).toMatchObject({
      level: "warn",
      service: "fontus",
      msg: "csp violation",
      directive: "script-src-elem",
      blocked: "https://evil.example",
      page: "/faq",
    });
  });
});
