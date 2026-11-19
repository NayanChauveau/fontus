import { createObservabilityPortAdapter } from "@/composition/adapters/createObservabilityPortAdapter";
import { createCspReportHandler } from "@/shared/infrastructure/http/csp";

/** One handler per server process, so the per-minute log limit is shared by every request. */
export const handleCspReport = createCspReportHandler({
  observability: createObservabilityPortAdapter(),
});
