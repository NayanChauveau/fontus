import siteConfig from "../../../site.config.json";

/**
 * Audience measurement with the self-hosted Umami of the infrastructure (cookieless; contract in
 * infra-traefik's README, "Statistiques (Umami)"). Off unless site.config.json has `analytics`,
 * and only in production builds: next dev and the unit tests never load the tracker. Same
 * mechanism as manon-karsenti's src/core/http/analytics.ts.
 *
 * The tracker sends the page address with its query string, so that utm_* campaigns are
 * recorded; Umami's `data-exclude-search` would drop them too. The searched address also travels
 * in the query string (`?adresse=`): a filter (window.umamiBeforeSend) keeps only the utm_*
 * parameters of the page and referrer addresses, and drops the fragment.
 */
export type Analytics = { host: string; websiteId: string };

/** Name of the tracker's `data-before-send` function. */
export const BEFORE_SEND = "umamiBeforeSend";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isOrigin(value: unknown): value is string {
  if (typeof value !== "string" || !URL.canParse(value)) {
    return false;
  }
  const url = new URL(value);
  return url.protocol === "https:" && url.origin === value;
}

/** `analytics` of site.config.json: null or absent (off), or an https origin and a website UUID. */
export function parseAnalytics(value: unknown): Analytics | null {
  if (value === undefined || value === null) {
    return null;
  }
  const fields = typeof value === "object" && !Array.isArray(value) ? value : {};
  const { host, websiteId, ...rest } = fields as Record<string, unknown>;
  if (
    !isOrigin(host) ||
    typeof websiteId !== "string" ||
    !UUID.test(websiteId) ||
    Object.keys(rest).length > 0
  ) {
    throw new Error("site.config.json: analytics invalide (origine https, UUID du site)");
  }
  return { host, websiteId };
}

export const ANALYTICS = parseAnalytics((siteConfig as { analytics?: unknown }).analytics);

export function activeAnalytics(
  analytics: Analytics | null,
  nodeEnv: string | undefined,
): Analytics | null {
  return nodeEnv === "production" ? analytics : null;
}

/** The filter, as an inline script (ES2017, run before the deferred tracker). */
export function beforeSendScript(): string {
  return `window.${BEFORE_SEND}=function(){function clean(v){if(!v)return v;var u;try{u=new URL(v,location.href)}catch(e){return ""}var q=new URLSearchParams();u.searchParams.forEach(function(x,k){if(/^utm_/i.test(k))q.append(k,x)});u.search=q.toString();u.hash="";return v.charAt(0)==="/"?u.pathname+u.search:u.href}return function(t,d){if(!d||!("url" in d))return d;return Object.assign({},d,{url:clean(d.url),referrer:clean(d.referrer)})}}();`;
}

/** Props of the two script tags of the root layout (null when analytics is off). */
export function analyticsScripts({
  analytics,
  nonce,
  domain,
}: {
  analytics: Analytics | null;
  nonce: string | undefined;
  /** The site's domain: copies served elsewhere (local builds, tests) send nothing. */
  domain: string;
}) {
  if (!analytics) {
    return null;
  }
  return [
    { nonce, dangerouslySetInnerHTML: { __html: beforeSendScript() } },
    {
      defer: true,
      nonce,
      src: `${analytics.host}/script.js`,
      "data-website-id": analytics.websiteId,
      "data-domains": `${domain},www.${domain}`,
      "data-do-not-track": "true",
      "data-before-send": BEFORE_SEND,
    },
  ] as const;
}
