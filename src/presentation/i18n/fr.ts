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
    guide: {
      howTitle: "Comment consulter la qualité de l’eau du robinet",
      howStep1:
        "Saisissez une adresse française : on identifie la commune et son code INSEE.",
      howStep2:
        "S’il y a plusieurs réseaux, choisissez votre unité de distribution (UDI), souvent indiquée sur la facture d’eau.",
      howStep3:
        "Consultez les dernières analyses officielles et comparez-les aux normes (France, Union européenne, Suisse, États-Unis, OMS).",
      sourcesTitle: "D’où viennent les données ?",
      sourcesBody:
        "Les mesures viennent de Hub’Eau (base SISE-Eaux du contrôle sanitaire). La conclusion ARS du prélèvement est reproduite, non recalculée. Fontus n’est pas un service de l’ARS ni du ministère.",
      paramsTitle: "Paramètres souvent consultés",
      paramsIntro:
        "L’outil affiche notamment les substances suivies pour la conformité de l’eau potable : PFAS, nitrates, plomb, pesticides, microbiologie et calcaire.",
      paramPfas: "PFAS",
      paramNitrates: "Nitrates",
      paramLead: "Plomb",
      paramPesticides: "Pesticides",
      paramMicrobio: "Microbiologie",
      paramHardness: "Calcaire",
      limitsTitle: "Ce que Fontus ne dit pas",
      limitsBody:
        "On ne dit pas si l’eau est « bonne ». On montre la mesure, la norme française, et des comparaisons étrangères. Le bandeau ARS reste le verdict légal.",
      citiesNote:
        "Les 50 communes de métropole les plus peuplées ont aussi une page par ville.",
      citiesLink: "Voir les grandes villes",
    },
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
    loadingHint: "Cela peut prendre quelques secondes.",
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
    breadcrumb: "Fil d’Ariane",
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
  nav: {
    home: "Accueil",
    howToRead: "Comment lire une analyse",
    faq: "FAQ",
    glossary: "Glossaire",
    pfas: "PFAS",
    nitrates: "Nitrates",
    lead: "Plomb",
    cities: "Grandes villes",
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
  pages: {
    cta: "Voir les analyses de votre commune",
    limitCurrent: "Limite légale française en vigueur : {{value}}.",
    limitSource: "Source : {{citation}}.",
    limitUpcoming:
      "À partir du {{date}}, les mêmes textes prévoient une limite de {{value}}.",
    how: {
      title: "Comment lire une analyse de l’eau du robinet",
      description:
        "Comprendre une analyse officielle ARS : conclusion légale, LQ, conformité, PFAS-20 et les colonnes FR, UE, CH, US et OMS.",
      arsTitle: "La conclusion ARS : le verdict légal",
      arsBody:
        "Le bandeau ARS est la conclusion officielle de ce prélèvement. Fontus la reproduit, sans la recalculer. Un tableau de comparaison vert ou rouge sur ce site ne remplace pas ce verdict.",
      limitsTitle: "Limites bactériologiques et physico-chimiques",
      limitsBody:
        "Le contrôle sanitaire distingue les limites bactériologiques (par exemple Escherichia coli et entérocoques) des limites physico-chimiques (nitrates, métaux, pesticides, PFAS, etc.). Un résultat non conforme d’un côté comme de l’autre figure dans la conclusion officielle.",
      valueTitle: "Valeur, LQ et conformité",
      valueBody:
        "Le résultat publié peut être un nombre ou « inférieur à la limite de quantification » (LQ) : le laboratoire ne quantifie pas la substance en dessous de ce seuil. La conformité se juge à la norme française applicable à la date du prélèvement, pas à une évolution ultérieure du texte.",
      pfasTitle: "PFAS-20 et PFAS individuels",
      pfasBody:
        "En France et dans l’UE, les PFAS individuels (PFOA, PFOS, etc.) n’ont pas de limite légale : seule la somme PFAS-20 est réglementée. La Suisse et les États-Unis fixent certaines limites individuelles. L’OMS n’a pas encore de valeur guide PFAS adoptée.",
      datesTitle: "Pourquoi les dates diffèrent selon les paramètres",
      datesBody:
        "Chaque paramètre garde la date de sa dernière mesure. Les campagnes PFAS sont souvent distinctes du dernier contrôle courant. Les cartes de vigilance peuvent donc dater d’une autre campagne que la conclusion ARS en haut de page.",
      compareTitle: "Colonnes FR, UE, CH, US et OMS",
      compareBody:
        "La colonne française est la référence légale pour un réseau en France. Les colonnes UE, Suisse et États-Unis sont des comparaisons juridiques étrangères. La colonne OMS reprend des valeurs guides, pas des limites légales. La colonne « Stricte » est une métrique Fontus, pas une norme officielle.",
      contactTitle: "Quand contacter la mairie ou l’ARS",
      contactBody:
        "En cas de restriction, de conclusion non conforme ou de question de santé, contactez votre ARS ou votre exploitant. Fontus ne donne pas de conseil médical et ne dit pas si l’eau est « bonne ».",
    },
    faq: {
      title: "Questions fréquentes sur l’eau du robinet",
      description:
        "UDI, analyses officielles, PFAS, nitrates, plomb, et ce que Fontus ne remplace pas.",
      potableQ: "L’eau du robinet est-elle potable ?",
      potableA:
        "Fontus ne répond pas à la place de l’ARS. Ouvrez votre commune, lisez la conclusion officielle de votre unité de distribution (UDI), et suivez les consignes de votre ARS ou de votre exploitant si une restriction est en vigueur.",
      udiQ: "Comment savoir quel est mon réseau (UDI) ?",
      udiA:
        "Le plus simple : sur votre facture d’eau, la fiche ARS annuelle indique le nom de l’unité de distribution. Vous pouvez aussi comparer le code à 9 chiffres ou le nom du réseau avec le site du ministère, puis choisir le réseau correspondant sur Fontus.",
      whereQ: "Où trouver les analyses de ma commune ?",
      whereA:
        "Saisissez votre adresse sur Fontus pour ouvrir les analyses officielles Hub’Eau / SISE-Eaux. Le site du ministère reste le point d’entrée public officiel.",
      paramsQ: "Que signifient les nitrates, les PFAS et le plomb ?",
      paramsA:
        "Ce sont des paramètres du contrôle sanitaire de l’eau potable. Fontus montre la dernière mesure et la norme française, plus des comparaisons étrangères. Des pages dédiées détaillent chaque sujet, sans remplacer la conclusion ARS.",
      officialQ: "Fontus remplace-t-il le site du ministère ou de l’ARS ?",
      officialA:
        "Non. Fontus est une couche de comparaison personnelle sur des données ouvertes. Le verdict légal reste la conclusion ARS. En cas de doute, passez par les sites officiels et contactez votre ARS.",
      freshQ: "Les données sont-elles à jour ?",
      freshA:
        "Fontus affiche les dernières campagnes publiées par Hub’Eau (SISE-Eaux). La date indiquée est celle du prélèvement de chaque paramètre, qui peut différer d’une substance à l’autre.",
      drinkQ: "Puis-je boire l’eau si un paramètre dépasse la norme ?",
      drinkA:
        "Fontus ne donne pas cet avis. Lisez la conclusion ARS du prélèvement et, si besoin, interrogez votre ARS, votre exploitant ou un professionnel de santé.",
    },
    glossary: {
      title: "Glossaire de l’eau du robinet",
      description:
        "UDI, INSEE, LQ, PFAS-20, titre hydrotimétrique, SISE-Eaux, Hub’Eau, limite légale et référence de qualité.",
      udiTerm: "UDI",
      udiDef:
        "Unité de distribution interne : le réseau qui alimente votre robinet. Elle a un code à 9 chiffres. Une commune peut avoir plusieurs UDI (quartiers, années successives).",
      inseeTerm: "Code INSEE",
      inseeDef:
        "Identifiant officiel d’une commune française. Fontus s’en sert pour lister les réseaux de distribution rattachés à cette commune.",
      lqTerm: "LQ",
      lqDef:
        "Limite de quantification : en dessous de ce seuil, le laboratoire publie un résultat non quantifié (souvent « < LQ »). Ce n’est pas un zéro.",
      pfas20Term: "PFAS-20",
      pfas20Def:
        "Somme réglementée de vingt substances per- et polyfluoroalkylées. En France et dans l’UE, cette somme est la limite légale PFAS ; les PFAS individuels n’ont pas de limite légale française.",
      thTerm: "TH (titre hydrotimétrique)",
      thDef:
        "Mesure de la dureté de l’eau (calcium et magnésium). La France n’a pas de limite légale pour le TH : c’est un indicateur de calcaire, pas un verdict de potabilité.",
      siseTerm: "SISE-Eaux",
      siseDef:
        "Système d’information national du contrôle sanitaire des eaux destinées à la consommation humaine, utilisé par les ARS.",
      hubeauTerm: "Hub’Eau",
      hubeauDef:
        "API publique qui diffuse les données SISE-Eaux. C’est la source des mesures affichées sur Fontus.",
      legalTerm: "Limite légale",
      legalDef:
        "Maximum (ou intervalle) opposable dans la réglementation applicable. Un résultat au-dessus de cette limite est non conforme.",
      qualityTerm: "Référence de qualité",
      qualityDef:
        "Indicateur non contraignant (par exemple aluminium ou fer). Un dépassement n’est pas à lui seul une non-conformité légale.",
    },
    pfas: {
      title: "PFAS dans l’eau du robinet en France",
      description:
        "Ce que sont les PFAS et la somme PFAS-20, la limite légale française lue dans le catalogue officiel, et comment consulter votre commune.",
      whatTitle: "Que sont les PFAS ?",
      whatBody:
        "Les PFAS sont des substances per- et polyfluoroalkylées, parfois appelées « polluants éternels ». Le contrôle sanitaire peut publier des substances individuelles (PFOA, PFOS, etc.) et une somme réglementée de vingt d’entre elles (PFAS-20).",
      limitTitle: "Réglementation française",
      compareTitle: "Comparaisons internationales sur Fontus",
      compareBody:
        "L’outil montre aussi des limites individuelles suisses ou américaines quand elles existent, et la colonne OMS quand une valeur guide existe. Ces colonnes ne remplacent pas la conclusion ARS en France.",
    },
    nitrates: {
      title: "Nitrates dans l’eau du robinet",
      description:
        "Nitrates dans l’eau potable, limite légale française lue dans le catalogue officiel, et comment consulter votre commune.",
      whatTitle: "Que sont les nitrates ?",
      whatBody:
        "Les nitrates sont des composés azotés, souvent liés à l’agriculture et à l’assainissement. C’est un paramètre courant du contrôle sanitaire de l’eau potable.",
      limitTitle: "Réglementation française",
      compareTitle: "Voir le niveau dans votre commune",
      compareBody:
        "Fontus affiche la dernière mesure officielle de votre UDI et la compare à la norme française et à des références étrangères. Le bandeau ARS reste le verdict légal.",
    },
    lead: {
      title: "Plomb dans l’eau du robinet",
      description:
        "Plomb au robinet, limite légale française lue dans le catalogue officiel, y compris le resserrement déjà versionné, et comment consulter votre commune.",
      whatTitle: "D’où vient le plomb ?",
      whatBody:
        "Le plomb dans l’eau du robinet vient souvent des branchements ou de la plomberie intérieure, pas de la ressource. Le contrôle sanitaire publie la concentration mesurée au robinet ou en un point représentatif du réseau.",
      limitTitle: "Réglementation française",
      compareTitle: "Voir le niveau dans votre commune",
      compareBody:
        "Fontus affiche la dernière mesure officielle de plomb pour votre UDI. Un résultat sous la limite légale n’est pas un avis médical. Pour une question de santé, contactez votre ARS ou un professionnel de santé.",
    },
    city: {
      hubTitle: "Qualité de l’eau du robinet dans les grandes villes",
      hubDescription:
        "Analyses officielles de l’eau du robinet pour les 50 communes de métropole les plus peuplées : réseaux de distribution (UDI) par ville.",
      hubCrumb: "Grandes villes",
      hubIntro:
        "Ces pages couvrent les 50 communes de métropole les plus peuplées. Chaque ville ouvre le même outil de recherche, avec la commune déjà renseignée.",
      title: "Qualité de l’eau du robinet à {{name}}",
      description:
        "Réseaux de distribution (UDI) et analyses officielles de l’eau du robinet à {{name}} ({{department}}, {{insee}}).",
    },
  },
} as const satisfies Messages;
