import { ensureApplication } from "@/composition/bootstrap";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
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

  ensureApplication().reportError({
    scope: typeof record.scope === "string" ? record.scope.slice(0, 40) : "ui",
    event: typeof record.event === "string" ? record.event.slice(0, 80) : "client_error",
    cause: message,
    context: {
      digest: typeof record.digest === "string" ? record.digest.slice(0, 80) : null,
    },
  });

  return Response.json({ ok: true });
}
