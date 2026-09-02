import { ensureApplication } from "@/composition/bootstrap";
import { enforceRateLimit } from "@/composition/http/enforceRateLimit";
import { handleRouteError } from "@/composition/http/handleRouteError";

export const dynamic = "force-dynamic";

const SCOPES = new Set(["ui"]);
const EVENTS = new Set(["app_error", "client_error"]);

export async function POST(request: Request) {
  try {
    await enforceRateLimit(request, "errors");
  } catch (error) {
    return handleRouteError(error, { scope: "ui", event: "errors_rate_limited" });
  }

  let body: unknown = null;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "INVALID_BODY" }, { status: 400 });
  }

  const record = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const message =
    typeof record.message === "string" ? record.message.slice(0, 500) : "";
  if (!message) {
    return Response.json({ error: "INVALID_BODY" }, { status: 400 });
  }

  const scope = typeof record.scope === "string" ? record.scope : "ui";
  const event = typeof record.event === "string" ? record.event : "client_error";
  if (!SCOPES.has(scope) || !EVENTS.has(event)) {
    return Response.json({ error: "INVALID_BODY" }, { status: 400 });
  }

  ensureApplication().reportError({
    scope,
    event,
    cause: message,
    context: {
      digest: typeof record.digest === "string" ? record.digest.slice(0, 80) : null,
    },
  });

  return Response.json({ ok: true });
}
