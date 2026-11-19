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

describe("privacy policy: cookieless audience measurement", () => {
  it.each([
    ["fr", fr.legal, "sans cookie", "n’est pas conservée", "n’est jamais transmise"],
    ["en", en.legal, "without cookies", "is not stored", "is never sent"],
  ])("%s describes Umami on our server, what it records and never keeps", (_, legal, cookie, ip, address) => {
    const text = legal.privacyAnalytics;
    expect(text).toContain("Umami");
    expect(text).toContain(cookie);
    expect(text).toContain(ip);
    expect(text).toContain(address);
    expect(text).toMatch(/utm/);
    expect(text).toMatch(/Do Not Track/);
    expect(legal.privacyDescription).toMatch(/Umami/);
  });

  it.each([
    ["fr", fr.legal, "Ces statistiques sont conservées 25 mois, puis supprimées automatiquement."],
    ["en", en.legal, "These statistics are kept for 25 months, then deleted automatically."],
  ])("%s states the 25-month retention (enforced by infra-traefik's monthly purge)", (_, legal, sentence) => {
    expect(legal.privacyAnalytics).toContain(sentence);
  });
});
