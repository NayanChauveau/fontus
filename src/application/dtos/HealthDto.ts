export type HealthStatus = "ok" | "error";

export type HealthDto = {
  status: HealthStatus;
  postgres: boolean;
  schema: boolean;
  detail: string | null;
  checkedAt: string;
};
