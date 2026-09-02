import { isApplicationError } from "@/application/errors/ApplicationError";
import { ensureApplication } from "@/composition/bootstrap";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q") ?? "";

  try {
    const dto = await ensureApplication().suggestAddressesUseCase.execute(
      query,
    );
    return Response.json(dto);
  } catch (error) {
    if (isApplicationError(error)) {
      return Response.json({ error: error.code }, { status: 503 });
    }
    throw error;
  }
}
