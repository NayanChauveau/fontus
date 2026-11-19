import { runInNewContext } from "node:vm";
import { describe, expect, it } from "vitest";
import siteConfig from "../../../site.config.json";
import {
  ANALYTICS,
  BEFORE_SEND,
  activeAnalytics,
  analyticsScripts,
  beforeSendScript,
  parseAnalytics,
} from "./analytics";

const umami = {
  host: "https://stats.example.test",
  websiteId: "3f1c2a4e-8b7d-4c6e-9a5f-1e2d3c4b5a69",
};

describe("analytics configuration (site.config.json)", () => {
  it("is optional: absent or null is off, a valid one is kept", () => {
    expect(parseAnalytics(undefined)).toBeNull();
    expect(parseAnalytics(null)).toBeNull();
    expect(parseAnalytics(umami)).toEqual(umami);
  });

  it.each([
    { ...umami, host: "http://stats.example.test" },
    { ...umami, host: "https://stats.example.test/" },
    { ...umami, host: "https://stats.example.test/umami" },
    { ...umami, host: "stats.example.test" },
    { ...umami, host: 42 },
    { ...umami, websiteId: "not-a-uuid" },
    { host: umami.host },
    { ...umami, domains: "example.test" },
    "https://stats.example.test",
    [],
  ])("refuses %j", (value) => {
    expect(() => parseAnalytics(value)).toThrow(/site\.config\.json: analytics/);
  });

  it("is the site's own configuration", () => {
    expect(ANALYTICS).toEqual(parseAnalytics((siteConfig as { analytics?: unknown }).analytics));
  });

  it("measures production builds only, never next dev nor the tests", () => {
    expect(activeAnalytics(umami, "production")).toEqual(umami);
    expect(activeAnalytics(umami, "development")).toBeNull();
    expect(activeAnalytics(umami, "test")).toBeNull();
    expect(activeAnalytics(null, "production")).toBeNull();
  });
});

function beforeSend(origin: string) {
  const window: Record<string, unknown> = {};
  runInNewContext(beforeSendScript(), {
    window,
    location: new URL(`${origin}/`),
    URL,
    URLSearchParams,
  });
  const filter = window[BEFORE_SEND] as (type: string, payload: object) => object | null;
  // Objects made in the script's own realm: compared as plain data.
  return (type: string, payload: object) =>
    JSON.parse(JSON.stringify(filter(type, payload))) as Record<string, unknown> | null;
}

describe("before sending a visit", () => {
  const origin = "https://fontus.example.test";
  const send = beforeSend(origin);

  it("keeps only the utm_* parameters: the searched address never leaves", () => {
    expect(
      send("event", {
        url: `${origin}/eau-robinet/paris?adresse=10+rue+de+rivoli&utm_source=lettre&utm_medium=email#x`,
        referrer: "https://www.qwant.com/?q=eau+paris",
        title: "Paris",
      }),
    ).toEqual({
      url: `${origin}/eau-robinet/paris?utm_source=lettre&utm_medium=email`,
      referrer: "https://www.qwant.com/",
      title: "Paris",
    });
  });

  it("trims a same-site referrer the same way, and passes other payloads through", () => {
    expect(
      send("event", { url: `${origin}/faq`, referrer: "/eau-robinet/paris?adresse=x" }),
    ).toEqual({ url: `${origin}/faq`, referrer: "/eau-robinet/paris" });
    expect(send("event", { url: `${origin}/faq` })).toEqual({ url: `${origin}/faq` });
    expect(send("identify", { website: "w" })).toEqual({ website: "w" });
    expect(send("event", { url: "http://[bad", referrer: "" })).toEqual({ url: "", referrer: "" });
  });
});

describe("the tags of the layout", () => {
  it("defer the tracker with the nonce, honour Do Not Track and keep the query for utm_*", () => {
    const scripts = analyticsScripts({ analytics: umami, nonce: "abc", domain: "fontus.example.test" });
    expect(scripts).not.toBeNull();
    const [filter, tracker] = scripts ?? [];
    expect(filter?.nonce).toBe("abc");
    expect(filter?.dangerouslySetInnerHTML.__html).toContain(BEFORE_SEND);
    // data-exclude-search would drop the query, utm_* included: the filter trims it instead.
    expect(tracker).toEqual({
      defer: true,
      nonce: "abc",
      src: `${umami.host}/script.js`,
      "data-website-id": umami.websiteId,
      "data-domains": "fontus.example.test,www.fontus.example.test",
      "data-do-not-track": "true",
      "data-before-send": BEFORE_SEND,
    });
  });

  it("are absent when analytics is off", () => {
    expect(analyticsScripts({ analytics: null, nonce: "abc", domain: "x.test" })).toBeNull();
  });
});
