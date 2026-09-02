import type { ObservabilityPort } from "@/application/ports/ObservabilityPort";
import { createObservability } from "@/shared/infrastructure/observability/createObservability";

export function createObservabilityPortAdapter(): ObservabilityPort {
  const production = process.env.NODE_ENV === "production";
  return createObservability({
    write: (line) => {
      console.error(line);
    },
    pretty: !production,
    environment:
      process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development",
  });
}
