import { isApplicationError } from "@/application/errors/ApplicationError";
import type { ObservabilityContext } from "@/application/ports/ObservabilityPort";
import { ensureApplication } from "@/composition/bootstrap";

export function handleRouteError(
  error: unknown,
  input: {
    scope: string;
    event: string;
    context?: ObservabilityContext;
  },
): Response {
  if (isApplicationError(error)) {
    ensureApplication().reportError({
      scope: input.scope,
      event: input.event,
      code: error.code,
      cause: error.cause,
      context: input.context,
    });
    if (error.code === "RATE_LIMITED") {
      return Response.json({ error: error.code }, { status: 429 });
    }
    if (error.code === "UNEXPECTED") {
      return Response.json({ error: error.code }, { status: 500 });
    }
    return Response.json({ error: error.code }, { status: 503 });
  }

  ensureApplication().reportError({
    scope: input.scope,
    event: `${input.event}_unexpected`,
    cause: redactError(error),
    context: input.context,
  });
  return Response.json({ error: "UNEXPECTED" }, { status: 500 });
}

function redactError(error: unknown): unknown {
  if (!(error instanceof Error)) {
    return error;
  }
  return new Error(error.message.replace(/[a-z]+:\/\/[^\s]+/gi, "[redacted]"));
}
