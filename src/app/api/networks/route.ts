import { isInseeCitycode } from "@/application/citycode";
import { ensureApplication } from "@/composition/bootstrap";
import { enforceRateLimit } from "@/composition/http/enforceRateLimit";
import { handleRouteError } from "@/composition/http/handleRouteError";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const citycode = new URL(request.url).searchParams.get("citycode") ?? "";

  if (!isInseeCitycode(citycode)) {
    return Response.json({ error: "INVALID_CITYCODE" }, { status: 400 });
  }

  try {
    await enforceRateLimit(request, "networks");
    const dto =
      await ensureApplication().listDistributionNetworksUseCase.execute(
        citycode,
      );
    return Response.json(dto);
  } catch (error) {
    return handleRouteError(error, {
      scope: "network",
      event: "networks_unavailable",
      context: { citycode },
    });
  }
}
