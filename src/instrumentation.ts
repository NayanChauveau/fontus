import type { NextErrorContext, NextRequestInfo } from "@/composition/http/reportRequestError";

/**
 * Next.js instrumentation: every unhandled request error is logged as one JSON line with its
 * stack trace (and sent to Sentry when SENTRY_DSN is set), like the app's own errors.
 */
export async function onRequestError(error: unknown, request: NextRequestInfo, context: NextErrorContext) {
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return;
  }
  const [{ reportRequestError }, { createObservabilityPortAdapter }] = await Promise.all([
    import("@/composition/http/reportRequestError"),
    import("@/composition/adapters/createObservabilityPortAdapter"),
  ]);
  reportRequestError(createObservabilityPortAdapter(), error, request, context);
}
