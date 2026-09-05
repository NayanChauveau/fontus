export type HealthPing = {
  ok: boolean;
  postgres: boolean;
  schema: boolean;
  detail: string | null;
  at: Date;
};

export type HealthPort = {
  ping(): Promise<HealthPing>;
};
