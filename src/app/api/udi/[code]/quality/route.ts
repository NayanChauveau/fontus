import { isNetworkCode, normalizeNetworkCode } from "@/application/networkCode";
import { ensureApplication } from "@/composition/bootstrap";
import { handleRouteError } from "@/composition/http/handleRouteError";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(
  _request: Request,
  context: { params: Promise<{ code: string }> },
) {
  const { code } = await context.params;
  const networkCode = normalizeNetworkCode(code ?? "");

  if (!isNetworkCode(networkCode)) {
    return Response.json({ error: "INVALID_NETWORK_CODE" }, { status: 400 });
  }

  try {
    const dto =
      await ensureApplication().getNetworkWaterQualityUseCase.execute(
        networkCode,
      );
    return Response.json(dto);
  } catch (error) {
    return handleRouteError(error, {
      scope: "analyses",
      event: "quality_unavailable",
      context: { networkCode },
    });
  }
}
