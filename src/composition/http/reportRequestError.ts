import type { ObservabilityPort } from "@/application/ports/ObservabilityPort";

/** Shapes of Next.js `onRequestError` arguments (instrumentation hook). */
export type NextRequestInfo = { path: string; method: string; headers: Record<string, string | string[] | undefined> };
export type NextErrorContext = { routerKind: string; routePath: string; routeType: string };

/**
 * Reports an error Next.js did not handle (page render, route handler, server action) through the
 * same JSON log line as the rest of the app, stack trace included. The query string is dropped:
 * it may carry user input.
 */
export function reportRequestError(
  port: ObservabilityPort,
  error: unknown,
  request: NextRequestInfo,
  context: NextErrorContext,
): void {
  const digest =
    error && typeof error === "object" && "digest" in error && typeof error.digest === "string"
      ? error.digest
      : undefined;
  port.report({
    level: "error",
    scope: "next",
    event: "request_failed",
    cause: error,
    context: {
      method: request.method,
      path: request.path.split("?")[0],
      routePath: context.routePath,
      routeType: context.routeType,
      digest,
    },
  });
}
