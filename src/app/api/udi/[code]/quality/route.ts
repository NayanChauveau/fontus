import { isApplicationError } from "@/application/errors/ApplicationError";
import { isNetworkCode, normalizeNetworkCode } from "@/application/networkCode";
import { ensureApplication } from "@/composition/bootstrap";

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
    if (isApplicationError(error)) {
      console.error(
        JSON.stringify({
          scope: "analyses",
          event: "quality_unavailable",
          networkCode,
          cause:
            error.cause instanceof Error
              ? { name: error.cause.name, message: error.cause.message }
              : String(error.cause ?? error.message),
        }),
      );
      return Response.json({ error: error.code }, { status: 503 });
    }
    throw error;
  }
}
