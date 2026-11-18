import { describe, expect, it } from "vitest";
import { en } from "./en";
import { fr } from "./fr";

describe("privacy policy: server log and its processors", () => {
  it.each([
    ["fr", fr.legal.privacyLogs, "environ 14 jours"],
    ["en", en.legal.privacyLogs, "about 14 days"],
  ])("%s names Grafana Cloud, CrowdSec and Sentry, and no longer Datadog", (_, text, retention) => {
    expect(text).toContain("Grafana");
    expect(text).toContain("CrowdSec");
    expect(text).toContain("Sentry");
    expect(text).toContain(retention);
    expect(text).not.toMatch(/Datadog/i);
  });
});
