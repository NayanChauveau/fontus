import { normalizeCitycode } from "../citycode";

export type LargestCity = {
  slug: string;
  insee: string;
  name: string;
  department: string;
};

/**
 * 50 communes de métropole les plus peuplées (populations de référence INSEE 2023).
 * Codes commune officiels (COG), pas d’arrondissements. Hors DOM-TOM
 * (Saint-Denis 97411 et Saint-Paul 97415 exclus : saint-denis = 93066).
 * Noms et départements vérifiés via geo.api.gouv.fr.
 */
export const LARGEST_CITIES: readonly LargestCity[] = [
  { slug: "paris", insee: "75056", name: "Paris", department: "Paris" },
  { slug: "marseille", insee: "13055", name: "Marseille", department: "Bouches-du-Rhône" },
  { slug: "lyon", insee: "69123", name: "Lyon", department: "Rhône" },
  { slug: "toulouse", insee: "31555", name: "Toulouse", department: "Haute-Garonne" },
  { slug: "nice", insee: "06088", name: "Nice", department: "Alpes-Maritimes" },
  { slug: "nantes", insee: "44109", name: "Nantes", department: "Loire-Atlantique" },
  { slug: "montpellier", insee: "34172", name: "Montpellier", department: "Hérault" },
  { slug: "strasbourg", insee: "67482", name: "Strasbourg", department: "Bas-Rhin" },
  { slug: "bordeaux", insee: "33063", name: "Bordeaux", department: "Gironde" },
  { slug: "lille", insee: "59350", name: "Lille", department: "Nord" },
  { slug: "rennes", insee: "35238", name: "Rennes", department: "Ille-et-Vilaine" },
  { slug: "toulon", insee: "83137", name: "Toulon", department: "Var" },
  { slug: "reims", insee: "51454", name: "Reims", department: "Marne" },
  { slug: "saint-etienne", insee: "42218", name: "Saint-Étienne", department: "Loire" },
  { slug: "le-havre", insee: "76351", name: "Le Havre", department: "Seine-Maritime" },
  { slug: "villeurbanne", insee: "69266", name: "Villeurbanne", department: "Rhône" },
  { slug: "dijon", insee: "21231", name: "Dijon", department: "Côte-d'Or" },
  { slug: "angers", insee: "49007", name: "Angers", department: "Maine-et-Loire" },
  { slug: "grenoble", insee: "38185", name: "Grenoble", department: "Isère" },
  { slug: "nimes", insee: "30189", name: "Nîmes", department: "Gard" },
  { slug: "aix-en-provence", insee: "13001", name: "Aix-en-Provence", department: "Bouches-du-Rhône" },
  { slug: "saint-denis", insee: "93066", name: "Saint-Denis", department: "Seine-Saint-Denis" },
  { slug: "clermont-ferrand", insee: "63113", name: "Clermont-Ferrand", department: "Puy-de-Dôme" },
  { slug: "le-mans", insee: "72181", name: "Le Mans", department: "Sarthe" },
  { slug: "brest", insee: "29019", name: "Brest", department: "Finistère" },
  { slug: "tours", insee: "37261", name: "Tours", department: "Indre-et-Loire" },
  { slug: "amiens", insee: "80021", name: "Amiens", department: "Somme" },
  { slug: "annecy", insee: "74010", name: "Annecy", department: "Haute-Savoie" },
  { slug: "limoges", insee: "87085", name: "Limoges", department: "Haute-Vienne" },
  { slug: "metz", insee: "57463", name: "Metz", department: "Moselle" },
  { slug: "perpignan", insee: "66136", name: "Perpignan", department: "Pyrénées-Orientales" },
  { slug: "boulogne-billancourt", insee: "92012", name: "Boulogne-Billancourt", department: "Hauts-de-Seine" },
  { slug: "besancon", insee: "25056", name: "Besançon", department: "Doubs" },
  { slug: "rouen", insee: "76540", name: "Rouen", department: "Seine-Maritime" },
  { slug: "orleans", insee: "45234", name: "Orléans", department: "Loiret" },
  { slug: "montreuil", insee: "93048", name: "Montreuil", department: "Seine-Saint-Denis" },
  { slug: "caen", insee: "14118", name: "Caen", department: "Calvados" },
  { slug: "argenteuil", insee: "95018", name: "Argenteuil", department: "Val-d'Oise" },
  { slug: "mulhouse", insee: "68224", name: "Mulhouse", department: "Haut-Rhin" },
  { slug: "nancy", insee: "54395", name: "Nancy", department: "Meurthe-et-Moselle" },
  { slug: "tourcoing", insee: "59599", name: "Tourcoing", department: "Nord" },
  { slug: "roubaix", insee: "59512", name: "Roubaix", department: "Nord" },
  { slug: "nanterre", insee: "92050", name: "Nanterre", department: "Hauts-de-Seine" },
  { slug: "vitry-sur-seine", insee: "94081", name: "Vitry-sur-Seine", department: "Val-de-Marne" },
  { slug: "asnieres-sur-seine", insee: "92004", name: "Asnières-sur-Seine", department: "Hauts-de-Seine" },
  { slug: "creteil", insee: "94028", name: "Créteil", department: "Val-de-Marne" },
  { slug: "avignon", insee: "84007", name: "Avignon", department: "Vaucluse" },
  { slug: "colombes", insee: "92025", name: "Colombes", department: "Hauts-de-Seine" },
  { slug: "poitiers", insee: "86194", name: "Poitiers", department: "Vienne" },
  { slug: "aubervilliers", insee: "93001", name: "Aubervilliers", department: "Seine-Saint-Denis" },
];

export function findCityBySlug(slug: string): LargestCity | undefined {
  const normalized = slug.trim().toLowerCase();
  return LARGEST_CITIES.find((city) => city.slug === normalized);
}

export function findCityByInsee(insee: string): LargestCity | undefined {
  const normalized = normalizeCitycode(insee);
  return LARGEST_CITIES.find((city) => city.insee === normalized);
}
