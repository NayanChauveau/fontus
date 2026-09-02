export const fr = {
  home: {
    title: "Qualité de l’eau du robinet",
    stackOk: "stack OK",
    stackKo: "stack KO",
    postgresOk: "PostgreSQL joignable",
    postgresKo: "PostgreSQL injoignable",
    checkedAt: "Vérifié à",
  },
  address: {
    title: "Quelle est votre adresse ?",
    subtitle:
      "Saisissez une adresse française pour identifier la commune et son code INSEE.",
    label: "Adresse",
    placeholder: "12 rue Sainte-Catherine, Bordeaux",
    searching: "Recherche…",
    noResults: "Aucune adresse trouvée.",
    unavailable:
      "Le service d’adresses est indisponible. Réessayez dans un instant.",
    selectedTitle: "Adresse retenue",
    fieldLabel: "Libellé",
    fieldCity: "Commune",
    fieldCitycode: "Code INSEE",
    fieldCoordinates: "Coordonnées",
    clear: "Changer d’adresse",
  },
  networks: {
    title: "Réseaux de distribution",
    loading: "Recherche des réseaux…",
    unavailable:
      "Impossible de charger les réseaux de distribution. Réessayez dans un instant.",
    confidenceExact: "certitude exacte",
    confidenceAmbiguous: "certitude ambiguë",
    confidenceNone: "aucun réseau",
    exactNote: "Cette commune n’a qu’un seul réseau de distribution.",
    ambiguousDisclaimer:
      "La donnée publique ne permet pas d’identifier le réseau à l’adresse.",
    howToFindTitle: "Comment savoir quel est votre réseau ?",
    howToFindBill:
      "Le plus simple : sur votre facture d’eau, la fiche ARS annuelle indique le nom de l’unité de distribution (UDI).",
    howToFindMinistry:
      "Sinon, ouvrez le site du ministère, choisissez votre région, département et commune, puis le réseau. Comparez le nom (ou le code à 9 chiffres) avec la liste ci-dessous.",
    howToFindLink: "Ouvrir le site du ministère",
    howToFindThen: "Ensuite, cliquez sur le réseau qui correspond.",
    ministryUrl: "https://sante.gouv.fr/sante-et-environnement/eaux/eau",
    chooseNetwork: "Choisir ce réseau",
    networkSelected: "Réseau retenu",
    changeNetwork: "Changer de réseau",
    hiddenNonResidential:
      "Les réseaux portuaires ou industriels ({{count}}) sont masqués : ils ne desservent pas une adresse d’habitation.",
    noneNote: "Aucun réseau recensé pour cette commune.",
    neighborhoods: "Quartier(s)",
    noNeighborhood: "Quartier non précisé",
    year: "Année",
    code: "Code réseau",
  },
} as const;
