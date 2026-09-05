export const HOW_TO_READ_PATH = "/comment-lire-une-analyse";
export const FAQ_PATH = "/faq";
export const GLOSSARY_PATH = "/glossaire";
export const PFAS_PATH = "/parametres/pfas";
export const NITRATES_PATH = "/parametres/nitrates";
export const LEAD_PATH = "/parametres/plomb";
export const CITY_HUB_PATH = "/eau-robinet";

export function cityPagePath(slug: string): string {
  return `${CITY_HUB_PATH}/${slug}`;
}

export function cityUdiPath(slug: string, udi: string): string {
  return `${cityPagePath(slug)}/${udi}`;
}

export const EDITORIAL_PATHS = [
  HOW_TO_READ_PATH,
  FAQ_PATH,
  GLOSSARY_PATH,
  PFAS_PATH,
  NITRATES_PATH,
  LEAD_PATH,
] as const;
