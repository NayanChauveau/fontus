import * as Sentry from "@sentry/node";
import type { ObservabilityPort } from "@/application/ports/ObservabilityPort";
import { createObservability } from "@/shared/infrastructure/observability/createObservability";

let sentryReady = false;

function ensureSentry(environment: string): boolean {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) {
    return false;
  }
  if (!sentryReady) {
    Sentry.init({
      dsn,
      environment,
      tracesSampleRate: 0.05,
    });
    sentryReady = true;
  }
  return true;
}

export function createObservabilityPortAdapter(): ObservabilityPort {
  const production = process.env.NODE_ENV === "production";
  const environment =
    process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development";
  const sink = createObservability({
    write: (line) => {
      console.error(line);
    },
    pretty: !production,
    environment,
  });

  return {
    report(event) {
      sink.report(event);
      if (event.level !== "error" || !ensureSentry(environment)) {
        return;
      }
      const tags = {
        scope: event.scope,
        event: event.event,
        ...(event.code ? { code: event.code } : {}),
      };
      if (event.cause instanceof Error) {
        Sentry.captureException(event.cause, { tags, extra: event.context });
        return;
      }
      Sentry.captureMessage(event.code ?? event.event, {
        level: "error",
        tags,
        extra: { cause: event.cause, context: event.context },
      });
    },
  };
}
