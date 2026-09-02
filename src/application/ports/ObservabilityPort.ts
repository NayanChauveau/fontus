export type ObservabilityLevel = "info" | "warn" | "error";

export type ObservabilityContext = Record<
  string,
  string | number | boolean | null | undefined
>;

export type ObservabilityEvent = {
  level: ObservabilityLevel;
  scope: string;
  event: string;
  code?: string;
  cause?: unknown;
  context?: ObservabilityContext;
};

export type ObservabilityPort = {
  report(event: ObservabilityEvent): void;
};
