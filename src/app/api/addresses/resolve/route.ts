import { isApplicationError } from "@/application/errors/ApplicationError";
import { ensureApplication } from "@/composition/bootstrap";

export const dynamic = "force-dynamic";

type ResolveBody = {
  id?: unknown;
  label?: unknown;
};

export async function POST(request: Request) {
  let body: ResolveBody = {};
  try {
    body = (await request.json()) as ResolveBody;
  } catch {
    body = {};
  }
  const id = typeof body.id === "string" ? body.id : "";
  const label = typeof body.label === "string" ? body.label : "";

  try {
    const dto = await ensureApplication().resolveAddressUseCase.execute({
      id,
      label,
    });
    return Response.json(dto);
  } catch (error) {
    if (isApplicationError(error)) {
      return Response.json({ error: error.code }, { status: 503 });
    }
    throw error;
  }
}
