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
    return Response.json({ error: error.code }, { status: 503 });
  }

  ensureApplication().reportError({
    scope: input.scope,
    event: `${input.event}_unexpected`,
    cause: error,
    context: input.context,
  });
  throw error;
}
