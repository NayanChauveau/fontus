import { existsSync } from "node:fs";

// Created in the old container by deploy/release.py just before it stops: Traefik's health
// check on /api/ready then takes it out of rotation, so no request reaches it as it closes.
const DRAIN_FLAG = "/tmp/draining";

// No database call: a slow Postgres must not make Traefik drop the whole site.
export function readiness(flag: string = DRAIN_FLAG): Response {
  return existsSync(flag)
    ? Response.json({ status: "draining" }, { status: 503 })
    : Response.json({ status: "ready" });
}
