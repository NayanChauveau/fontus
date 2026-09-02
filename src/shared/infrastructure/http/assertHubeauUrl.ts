const HUBEAU_HOST = "hubeau.eaufrance.fr";

export function parseHubeauUrl(raw: string): URL {
  const url = new URL(raw);
  if (url.protocol !== "https:" || url.hostname !== HUBEAU_HOST) {
    throw new Error("HUBEAU_UNTRUSTED_NEXT");
  }
  return url;
}
