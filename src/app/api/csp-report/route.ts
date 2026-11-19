import { handleCspReport } from "@/composition/http/handleCspReport";

export const dynamic = "force-dynamic";

/** Browsers report Content Security Policy violations here (src/shared/infrastructure/http/csp.ts). */
export const POST = handleCspReport;
