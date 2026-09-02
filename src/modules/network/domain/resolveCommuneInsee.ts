/**
 * BAN / Géoplateforme expose les arrondissements (75101, 13204, 69381…).
 * Hub’Eau `communes_udi` n’indexe que la commune : Paris 75056, Marseille
 * 13055, Lyon 69123.
 */
export function resolveCommuneInsee(citycode: string): string {
  const code = citycode.trim().toUpperCase();

  if (/^751(0[1-9]|1[0-9]|20)$/.test(code)) {
    return "75056";
  }
  if (/^132(0[1-9]|1[0-6])$/.test(code)) {
    return "13055";
  }
  if (/^6938[1-9]$/.test(code)) {
    return "69123";
  }

  return code;
}
