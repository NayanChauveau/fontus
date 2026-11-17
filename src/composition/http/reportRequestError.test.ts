import { describe, expect, it } from "vitest";
import type { ObservabilityEvent } from "@/application/ports/ObservabilityPort";
import { reportRequestError } from "./reportRequestError";

describe("reportRequestError", () => {
  it("reports an unhandled Next.js request error with its route context", () => {
    const events: ObservabilityEvent[] = [];
    const error = Object.assign(new Error("render failed"), { digest: "12345" });
    reportRequestError(
      { report: (event) => events.push(event) },
      error,
      { path: "/api/udi/1/quality?x=1", method: "GET", headers: {} },
      { routerKind: "App Router", routePath: "/api/udi/[code]/quality", routeType: "route" },
    );
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      level: "error",
      scope: "next",
      event: "request_failed",
      cause: error,
      context: {
        method: "GET",
        path: "/api/udi/1/quality",
        routePath: "/api/udi/[code]/quality",
        routeType: "route",
        digest: "12345",
      },
    });
  });

  it("never drops the report when the error is not an Error", () => {
    const events: ObservabilityEvent[] = [];
    reportRequestError({ report: (event) => events.push(event) }, "oops", { path: "/", method: "GET", headers: {} }, {
      routerKind: "App Router",
      routePath: "/",
      routeType: "render",
    });
    expect(events[0]?.cause).toBe("oops");
  });
});
