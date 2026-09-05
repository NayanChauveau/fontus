import { ensureApplication } from "@/composition/bootstrap";
import { enforceRateLimit } from "@/composition/http/enforceRateLimit";
import { handleRouteError } from "@/composition/http/handleRouteError";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await enforceRateLimit(request, "errors");
  } catch (error) {
    return handleRouteError(error, {
      scope: "observability",
      event: "sentry_check_rate_limited",
    });
  }

  const configured = Boolean(process.env.SENTRY_DSN);
  ensureApplication().reportError({
    scope: "observability",
    event: "sentry_check",
    cause: "Sentry configuration check",
  });

  return Response.json({ ok: true, configured });
}
