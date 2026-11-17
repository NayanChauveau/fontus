import { readiness } from "./readiness";

export const dynamic = "force-dynamic";

export function GET() {
  return readiness();
}
