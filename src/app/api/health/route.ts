import { ensureApplication } from "@/composition/bootstrap";

export const dynamic = "force-dynamic";

export async function GET() {
  const dto = await ensureApplication().healthCheckUseCase.execute();
  return Response.json(dto, { status: dto.status === "ok" ? 200 : 503 });
}
