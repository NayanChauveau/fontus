import { isInseeCitycode } from "@/application/citycode";
import { isApplicationError } from "@/application/errors/ApplicationError";
import { ensureApplication } from "@/composition/bootstrap";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const citycode = new URL(request.url).searchParams.get("citycode") ?? "";

  if (!isInseeCitycode(citycode)) {
    return Response.json({ error: "INVALID_CITYCODE" }, { status: 400 });
  }

  try {
    const dto =
      await ensureApplication().listDistributionNetworksUseCase.execute(
        citycode,
      );
    return Response.json(dto);
  } catch (error) {
    if (isApplicationError(error)) {
      return Response.json({ error: error.code }, { status: 503 });
    }
    throw error;
  }
}
