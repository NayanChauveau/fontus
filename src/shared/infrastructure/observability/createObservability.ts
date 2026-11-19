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
  service?: string;
}): ObservabilitySink {
  const now = deps.now ?? (() => new Date());
  const environment = deps.environment ?? "development";
  const service = deps.service ?? "fontus";

  return {
    report(event) {
      const cause = event.cause ? serializeCause(event.cause) : null;
      const described = event.cause
        ? describeDatabaseFailure(event.cause)
        : null;
      const context = compactContext(event.context);
      // Shared server log format (same keys as manon-karsenti's pino logger), one JSON object per
      // line: level, time, service, msg, then err for a cause, then Fontus's own keys. Alloy turns
      // `level` into a label; Grafana's error panel reads msg, err_message and err_stack.
      const payload = {
        level: event.level,
        time: now().toISOString(),
        service,
        msg: described?.detail ?? `${event.scope}.${event.event}`,
        ...(cause
          ? {
              // The stack stays inside the JSON string (escaped newlines): one line per event.
              err: {
                type: cause.name ?? typeof event.cause,
                message: cause.message,
                stack: cause.stack ?? null,
                chain: cause.chain,
              },
            }
          : {}),
        scope: event.scope,
        event: event.event,
        code: event.code ?? described?.code ?? null,
        context,
        environment,
      };

      deps.write(
        deps.pretty ? formatPretty(payload) : JSON.stringify(payload),
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

function formatPretty(payload: {
  level: string;
  msg: string;
  err?: { chain: string[]; stack: string | null };
  scope: string;
  event: string;
  code: string | null;
  context: Record<string, string | number | boolean | null> | null;
}): string {
  const header = `[${payload.level}] ${payload.scope}.${payload.event}${
    payload.code ? ` ${payload.code}` : ""
  }`;
  const lines = [header];
  if (payload.msg !== `${payload.scope}.${payload.event}`) {
    lines.push(`  ${payload.msg}`);
  }
  for (const item of payload.err?.chain ?? []) {
    lines.push(`  ${item}`);
  }
  if (payload.context) {
    lines.push(`  ${JSON.stringify(payload.context)}`);
  }
  if (payload.err?.stack) {
    lines.push(payload.err.stack);
  }
  return lines.join("\n");
}
