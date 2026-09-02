export type HealthStatus = "ok" | "error";

export type HealthDto = {
  status: HealthStatus;
  postgres: boolean;
  checkedAt: string;
};
