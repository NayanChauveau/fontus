import { headers } from "next/headers";

/** Request header through which src/proxy.ts hands the page's CSP nonce to the render. */
export const NONCE_HEADER = "x-nonce";

/** The nonce of this request's Content Security Policy, for the scripts the app writes itself. */
export async function requestNonce(): Promise<string | undefined> {
  return (await headers()).get(NONCE_HEADER) ?? undefined;
}
