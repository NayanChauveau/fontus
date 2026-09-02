export type HealthPing = {
  ok: boolean;
  at: Date;
};

export type HealthPort = {
  ping(): Promise<HealthPing>;
};
