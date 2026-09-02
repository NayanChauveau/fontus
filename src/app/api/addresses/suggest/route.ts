import { ensureApplication } from "@/composition/bootstrap";
import { handleRouteError } from "@/composition/http/handleRouteError";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q") ?? "";

  try {
    const dto = await ensureApplication().suggestAddressesUseCase.execute(
      query,
    );
    return Response.json(dto);
  } catch (error) {
    return handleRouteError(error, {
      scope: "geocoding",
      event: "suggest_unavailable",
      context: { queryLength: query.length },
    });
  }
}
