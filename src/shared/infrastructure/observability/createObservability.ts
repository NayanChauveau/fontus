import { describeDatabaseFailure } from "../db/describeDatabaseFailure";
import { serializeCause } from "./serializeCause";

type ObservabilityLevel = "info" | "warn" | "error";

type ObservabilityEvent = {
  level: ObservabilityLevel;
  scope: string;
  event: string;
  code?: string;
  cause?: unknown;
  context?: Record<string, string | number | boolean | null | undefined>;
};

export type ObservabilitySink = {
  report(event: ObservabilityEvent): void;
};

export function createObservability(deps: {
  write: (line: string) => void;
  now?: () => Date;
  environment?: string;
  pretty?: boolean;
}): ObservabilitySink {
  const now = deps.now ?? (() => new Date());
  const environment = deps.environment ?? "development";

  return {
    report(event) {
      const createdAt = now();
      const cause = event.cause ? serializeCause(event.cause) : null;
      const described = event.cause
        ? describeDatabaseFailure(event.cause)
        : null;
      const code = event.code ?? described?.code ?? null;
      const message =
        described?.detail ?? event.code ?? cause?.message ?? event.event;
      const context = compactContext(event.context);
      const payload = {
        ts: createdAt.toISOString(),
        level: event.level,
        scope: event.scope,
        event: event.event,
        code,
        message,
        cause: cause
          ? { name: cause.name, message: cause.message, chain: cause.chain }
          : null,
        context,
        environment,
      };

      deps.write(
        deps.pretty
          ? formatPretty(payload, cause?.stack)
          : JSON.stringify(payload),
      );
    },
  };
}

function compactContext(
  context: ObservabilityEvent["context"],
): Record<string, string | number | boolean | null> | null {
  if (!context) {
    return null;
  }
  const compact: Record<string, string | number | boolean | null> = {};
  for (const [key, value] of Object.entries(context)) {
    if (value !== undefined) {
      compact[key] = value;
    }
  }
  return Object.keys(compact).length > 0 ? compact : null;
}

function formatPretty(
  payload: {
    level: string;
    scope: string;
    event: string;
    code: string | null;
    message: string;
    cause: { chain: string[] } | null;
    context: Record<string, string | number | boolean | null> | null;
  },
  stack?: string,
): string {
  const header = `[${payload.level}] ${payload.scope}.${payload.event}${
    payload.code ? ` ${payload.code}` : ""
  }`;
  const lines = [header];
  if (payload.message && payload.message !== payload.event) {
    lines.push(`  ${payload.message}`);
  }
  for (const item of payload.cause?.chain ?? []) {
    lines.push(`  ${item}`);
  }
  if (payload.context) {
    lines.push(`  ${JSON.stringify(payload.context)}`);
  }
  if (stack) {
    lines.push(stack);
  }
  return lines.join("\n");
}
