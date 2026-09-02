import type { HealthDto } from "@/application/dtos/HealthDto";
import type { StackStatusViewModel } from "../view-models/StackStatusViewModel";

export function mapHealthDtoToStackStatus(
  dto: HealthDto,
): StackStatusViewModel {
  return {
    stackOk: dto.status === "ok" && dto.postgres,
    postgresOk: dto.postgres,
    checkedAt: dto.checkedAt,
  };
}
