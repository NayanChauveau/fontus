import type { Messages } from "./en";

export const fr = {
  home: {
    title: "Fontus",
    metaTitle: "Qualité de l’eau du robinet en France",
    description:
      "Comparaison des analyses officielles de l’eau du robinet en France.",
    metaDescription:
      "Consultez les analyses officielles de l’eau potable du robinet par commune : PFAS, nitrates, plomb, comparaison aux normes ARS, UE, Suisse, US et OMS.",
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
    clearQuery: "Effacer la saisie",
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
  analyses: {
    title: "Dernières analyses",
    loading: "Chargement des analyses officielles…",
    unavailable:
      "Impossible de charger les analyses. Réessayez dans un instant.",
    empty: "Aucune analyse récente pour ce réseau.",
    conclusionTitle: "Conclusion ARS",
    noConclusion: "Conclusion ARS non renseignée pour ce prélèvement.",
    officialNote:
      "Conclusion officielle de l’ARS pour le prélèvement du {{date}}, non recalculée.",
    cardsCampaignNote:
      "Les cartes de vigilance peuvent dater d’une autre campagne que cette conclusion.",
    compareFailed:
      "Les comparaisons sont temporairement indisponibles. Les mesures sont affichées sans tableau de conformité.",
    limitesBact: "Limites bactériologiques",
    limitesPc: "Limites physico-chimiques",
    conformeCode: "conformes",
    nonConformeCode: "non conformes",
    cardsTitle: "Points de vigilance",
    comparisonTitle: "Comparaison par substance",
    allAnalysesTitle: "Toutes les analyses",
    cardEmpty: "Pas d’analyse récente",
    notAnalysed: "non analysé",
    noRecentAnalysis: "pas d’analyse récente",
    udi: "UDI",
    unit: "Unité",
    thresholdSource: "Source du seuil",
    sourcesTitle: "Sources",
    sourceMeasurements: "Mesures",
    cardPfas: "PFAS",
    cardNitrates: "Nitrates",
    cardPesticides: "Pesticides",
    cardLead: "Plomb",
    cardArsenic: "Arsenic",
    cardMicrobio: "Microbiologie",
    cardHardness: "Calcaire",
    disclaimer:
      "On ne dit pas si l’eau est « bonne ». On montre la mesure, la norme française, et des comparaisons étrangères. Le bandeau ARS reste le verdict légal.",
    perParameterDateNote:
      "Chaque paramètre garde la date de sa dernière mesure. Les campagnes PFAS sont souvent distinctes du dernier contrôle courant.",
    sampledAt: "Prélèvement du",
    source: "Source",
    sourceRemote: "Hub’Eau (SISE-Eaux)",
    sourceCache: "Hub’Eau (SISE-Eaux), cache local",
    sourceImport: "data.gouv (SISE-Eaux DIS)",
    sourceHubEau: "Hub’Eau",
    parameter: "Paramètre",
    value: "Résultat",
    canonicalValue: "Valeur canonique",
    noThresholdNote:
      "En FR/UE, les PFAS individuels (PFOA, PFOS, etc.) n’ont pas de limite légale : seule la somme PFAS-20 (0,10 µg/L) est réglementée. La Suisse et les États-Unis fixent des limites individuelles. L’OMS n’a pas encore de valeur guide PFAS adoptée.",
    whoNote:
      "La colonne OMS reprend les valeurs guides des Guidelines for drinking-water quality. Ce ne sont pas des limites légales ; le bandeau ARS reste le verdict en France.",
    strictNote:
      "La colonne « Stricte » est une métrique du site : plus basse limite légale comparable parmi FR, UE, CH et US. L’OMS n’y entre pas. Ce n’est pas une norme officielle.",
    reconstructed: "reconstruit",
    reconstructedSumNote:
      "Quand Hub’Eau publie « <SEUIL » pour la somme PFAS-20, on calcule une borne haute à partir des 20 substances du même prélèvement (LQ si non détecté).",
    date: "Date",
    priorityTitle: "Paramètres prioritaires",
    converted: "converti",
    dictionaryId: "id",
    compareFr: "FR",
    compareEu: "UE",
    compareCh: "CH",
    compareUs: "US",
    compareWho: "OMS",
    compareStrict: "Stricte",
    compareSummary: "Norme",
    mobileNonCompliant: "non conforme",
    mobileCompareDetails: "Détail par norme",
    compliant: "conforme",
    exceedance: "dépassement",
    belowLoq: "LQ > seuil",
    notComparable: "non comparable",
    noThreshold: "pas de seuil",
    legalLimit: "limite légale",
    qualityReference: "référence de qualité",
    siteMetric: "référence stricte (site)",
    historyTitle: "Historique",
    historyWindow: "Fenêtre depuis",
    historyStats: "Min {{min}} · Médiane {{median}} · Max {{max}} ({{count}} mesures)",
    historyNoStats: "Pas assez de valeurs numériques pour des statistiques.",
    historyTrendRising: "tendance à la hausse",
    historyTrendFalling: "tendance à la baisse",
    historyTrendStable: "tendance stable",
    historyTrendInsufficient: "tendance : pas assez de points",
    historyLoqChanged:
      "La limite de quantification a changé sur la période : les points ne sont pas tous comparables.",
    historyChart: "Évolution",
    watchPfas20: "Somme PFAS-20",
    watchPfoa: "PFOA",
    watchPfos: "PFOS",
    watchNitrates: "Nitrates",
    watchNitrites: "Nitrites",
    watchPesticidesTotal: "Pesticides (total analysé)",
    watchAtrazine: "Atrazine",
    watchLead: "Plomb",
    watchArsenic: "Arsenic",
    watchEcoli: "Escherichia coli",
    watchEnterococci: "Entérocoques",
    watchHardness: "Titre hydrotimétrique",
  },
  errors: {
    unexpected: "Une erreur inattendue s’est produite.",
    retry: "Réessayer",
  },
  a11y: {
    skipToContent: "Aller au contenu",
  },
  notFound: {
    title: "Page introuvable",
    home: "Retour à l’accueil",
  },
  theme: {
    toggleToDark: "Passer en mode sombre",
    toggleToLight: "Passer en mode clair",
  },
  locale: {
    label: "Langue",
    french: "Français",
    english: "English",
  },
  legal: {
    mentions: "Mentions légales",
    privacy: "Confidentialité",
    mentionsTitle: "Mentions légales",
    mentionsDescription:
      "Éditeur, sources Hub’Eau / SISE-Eaux et hébergement de Fontus, comparateur d’analyses de l’eau du robinet.",
    privacyTitle: "Politique de confidentialité",
    privacyDescription:
      "Données traitées par Fontus : adresse BAN, quota IP, cookie de langue. Pas de compte utilisateur.",
    publisher:
      "Fontus est édité à titre personnel. Ce n’est pas un service officiel de l’ARS ni du ministère.",
    sources:
      "Les mesures viennent de Hub’Eau (SISE-Eaux) et, le cas échéant, des extraits DIS data.gouv. La conclusion ARS est reproduite, non recalculée.",
    hosting:
      "Le site est hébergé sur un VPS personnel. La base reste sur ce serveur et n’est pas exposée sur Internet.",
    privacyIntro:
      "Pas de compte utilisateur. On ne traite que ce qui sert à répondre à une recherche.",
    privacyAddress:
      "L’adresse saisie est envoyée à notre serveur, qui interroge la BAN (adresse.data.gouv.fr) pour proposer des communes.",
    privacyIp:
      "L’IP de connexion sert à un quota court (Postgres), pour ne pas saturer les API publiques.",
    privacyCookie:
      "Un cookie de langue (eau-robinet-locale) retient FR ou EN pendant un an. SameSite=Lax ; Secure en HTTPS.",
    privacyLogs:
      "Les erreurs techniques peuvent partir vers Sentry (message, URL, pas le détail des analyses). Les logs de conteneurs peuvent aller vers Datadog si l’agent tourne sur le VPS.",
    privacyContact:
      "Pour une demande d’effacement de données côté serveur qui vous concerneraient, contactez l’éditeur du site.",
  },
} as const satisfies Messages;
