export const en = {
  home: {
    title: "Fontus",
    metaTitle: "Tap water quality in France",
    description: "Compare official tap water analyses in France.",
    metaDescription:
      "Check official tap water analyses by French municipality: PFAS, nitrates, lead, compared with ARS, EU, Swiss, US and WHO standards.",
    stackOk: "stack OK",
    stackKo: "stack KO",
    postgresOk: "PostgreSQL reachable",
    postgresKo: "PostgreSQL unreachable",
    checkedAt: "Checked at",
    guide: {
      howTitle: "How to check tap water quality",
      howStep1:
        "Enter a French address: we identify the municipality and its INSEE code.",
      howStep2:
        "If several networks exist, choose your distribution unit (UDI), often named on the water bill.",
      howStep3:
        "Read the latest official analyses and compare them with the standards (France, European Union, Switzerland, United States, WHO).",
      sourcesTitle: "Where does the data come from?",
      sourcesBody:
        "Measurements come from Hub’Eau (the SISE-Eaux sanitary-control database). The ARS conclusion for the sample is reproduced, not recalculated. Fontus is not an ARS or ministry service.",
      paramsTitle: "Parameters people look up",
      paramsIntro:
        "The tool shows substances used to assess drinking-water compliance, including PFAS, nitrates, lead, pesticides, microbiology and hardness.",
      paramPfas: "PFAS",
      paramNitrates: "Nitrates",
      paramLead: "Lead",
      paramPesticides: "Pesticides",
      paramMicrobio: "Microbiology",
      paramHardness: "Hardness",
      limitsTitle: "What Fontus does not say",
      limitsBody:
        "We do not say whether the water is “good”. We show the measurement, the French standard, and foreign comparisons. The ARS banner remains the legal verdict.",
    },
  },
  address: {
    title: "What is your address?",
    subtitle:
      "Enter a French address to identify the municipality and its INSEE code.",
    label: "Address",
    placeholder: "12 rue Sainte-Catherine, Bordeaux",
    searching: "Searching…",
    noResults: "No address found.",
    unavailable: "The address service is unavailable. Please try again shortly.",
    selectedTitle: "Selected address",
    fieldLabel: "Label",
    fieldCity: "Municipality",
    fieldCitycode: "INSEE code",
    fieldCoordinates: "Coordinates",
    clear: "Change address",
    clearQuery: "Clear the field",
  },
  networks: {
    title: "Distribution networks",
    loading: "Looking up networks…",
    unavailable:
      "Unable to load distribution networks. Please try again shortly.",
    confidenceExact: "exact match",
    confidenceAmbiguous: "ambiguous match",
    confidenceNone: "no network",
    exactNote: "This municipality has only one distribution network.",
    ambiguousDisclaimer:
      "Public data cannot identify the network at this address.",
    howToFindTitle: "How do I know which network is mine?",
    howToFindBill:
      "The simplest way: on your water bill, the annual ARS sheet names the distribution unit (UDI).",
    howToFindMinistry:
      "Otherwise, open the ministry website, choose your region, department and municipality, then the network. Compare the name (or the 9-digit code) with the list below.",
    howToFindLink: "Open the ministry website",
    howToFindThen: "Then click the matching network.",
    ministryUrl: "https://sante.gouv.fr/sante-et-environnement/eaux/eau",
    chooseNetwork: "Choose this network",
    networkSelected: "Selected network",
    changeNetwork: "Change network",
    hiddenNonResidential:
      "Port or industrial networks ({{count}}) are hidden: they do not serve a residential address.",
    noneNote: "No network listed for this municipality.",
    neighborhoods: "District(s)",
    noNeighborhood: "District not specified",
    year: "Year",
    code: "Network code",
  },
  analyses: {
    title: "Latest analyses",
    loading: "Loading official analyses…",
    unavailable: "Unable to load analyses. Please try again shortly.",
    empty: "No recent analysis for this network.",
    conclusionTitle: "ARS conclusion",
    noConclusion: "No ARS conclusion recorded for this sample.",
    officialNote:
      "Official ARS conclusion for the sample of {{date}}, not recalculated.",
    cardsCampaignNote:
      "Watch cards may come from another sampling campaign than this conclusion.",
    compareFailed:
      "Comparisons are temporarily unavailable. Measurements are shown without a compliance table.",
    limitesBact: "Bacteriological limits",
    limitesPc: "Physico-chemical limits",
    conformeCode: "compliant",
    nonConformeCode: "non-compliant",
    cardsTitle: "Points of attention",
    comparisonTitle: "Comparison by substance",
    allAnalysesTitle: "All analyses",
    cardEmpty: "No recent analysis",
    notAnalysed: "not analysed",
    noRecentAnalysis: "no recent analysis",
    udi: "UDI",
    unit: "Unit",
    thresholdSource: "Threshold source",
    sourcesTitle: "Sources",
    sourceMeasurements: "Measurements",
    cardPfas: "PFAS",
    cardNitrates: "Nitrates",
    cardPesticides: "Pesticides",
    cardLead: "Lead",
    cardArsenic: "Arsenic",
    cardMicrobio: "Microbiology",
    cardHardness: "Hardness",
    disclaimer:
      "We do not say whether the water is “good”. We show the measurement, the French standard, and foreign comparisons. The ARS banner remains the legal verdict.",
    perParameterDateNote:
      "Each parameter keeps the date of its latest measurement. PFAS campaigns are often separate from the latest routine check.",
    sampledAt: "Sampled on",
    source: "Source",
    sourceRemote: "Hub’Eau (SISE-Eaux)",
    sourceCache: "Hub’Eau (SISE-Eaux), local cache",
    sourceImport: "data.gouv (SISE-Eaux DIS)",
    sourceHubEau: "Hub’Eau",
    parameter: "Parameter",
    value: "Result",
    canonicalValue: "Canonical value",
    noThresholdNote:
      "In FR/EU, individual PFAS (PFOA, PFOS, etc.) have no legal limit: only the PFAS-20 sum (0.10 µg/L) is regulated. Switzerland and the United States set individual limits. WHO has no adopted PFAS guideline value yet.",
    whoNote:
      "The WHO column uses guideline values from the Guidelines for drinking-water quality. They are not legal limits; the ARS banner remains the legal verdict in France.",
    strictNote:
      "The “Strictest” column is a site metric: the lowest comparable legal limit among FR, EU, CH and US. WHO is excluded. It is not an official standard.",
    reconstructed: "reconstructed",
    reconstructedSumNote:
      "When Hub’Eau publishes “<SEUIL” for the PFAS-20 sum, we compute an upper bound from the 20 substances in the same sample (LOQ if not detected).",
    date: "Date",
    priorityTitle: "Priority parameters",
    converted: "converted",
    dictionaryId: "id",
    compareFr: "FR",
    compareEu: "EU",
    compareCh: "CH",
    compareUs: "US",
    compareWho: "WHO",
    compareStrict: "Strictest",
    compareSummary: "Limit",
    mobileNonCompliant: "non-compliant",
    mobileCompareDetails: "Breakdown by standard",
    compliant: "compliant",
    exceedance: "exceedance",
    belowLoq: "LOQ > limit",
    notComparable: "not comparable",
    noThreshold: "no threshold",
    legalLimit: "legal limit",
    qualityReference: "quality reference",
    siteMetric: "strictest reference (site)",
    historyTitle: "History",
    historyWindow: "Window from",
    historyStats:
      "Min {{min}} · Median {{median}} · Max {{max}} ({{count}} measurements)",
    historyNoStats: "Not enough numeric values for statistics.",
    historyTrendRising: "rising trend",
    historyTrendFalling: "falling trend",
    historyTrendStable: "stable trend",
    historyTrendInsufficient: "trend: not enough points",
    historyLoqChanged:
      "The limit of quantification changed over the period: points are not all comparable.",
    historyChart: "Trend",
    watchPfas20: "PFAS-20 sum",
    watchPfoa: "PFOA",
    watchPfos: "PFOS",
    watchNitrates: "Nitrates",
    watchNitrites: "Nitrites",
    watchPesticidesTotal: "Pesticides (total analysed)",
    watchAtrazine: "Atrazine",
    watchLead: "Lead",
    watchArsenic: "Arsenic",
    watchEcoli: "Escherichia coli",
    watchEnterococci: "Enterococci",
    watchHardness: "Hydrometric title",
  },
  errors: {
    unexpected: "An unexpected error occurred.",
    retry: "Try again",
  },
  a11y: {
    skipToContent: "Skip to content",
  },
  notFound: {
    title: "Page not found",
    home: "Back to home",
  },
  theme: {
    toggleToDark: "Switch to dark mode",
    toggleToLight: "Switch to light mode",
  },
  locale: {
    label: "Language",
    french: "Français",
    english: "English",
  },
  nav: {
    home: "Home",
  },
  legal: {
    mentions: "Legal notice",
    privacy: "Privacy",
    mentionsTitle: "Legal notice",
    mentionsDescription:
      "Publisher, Hub’Eau / SISE-Eaux sources and hosting of Fontus, a tap-water analysis comparison site.",
    privacyTitle: "Privacy policy",
    privacyDescription:
      "Data processed by Fontus: BAN address lookup, short IP quota, language cookie. No user accounts.",
    publisher:
      "Fontus is published on a personal basis. It is not an official ARS or ministry service.",
    sources:
      "Measurements come from Hub’Eau (SISE-Eaux) and, when used, data.gouv DIS extracts. The ARS conclusion is reproduced, not recalculated.",
    hosting:
      "The site is hosted on a personal VPS. The database stays on that server and is not exposed on the public internet.",
    privacyIntro:
      "We do not create user accounts. We process only what is needed to answer a search.",
    privacyAddress:
      "The address you type is sent to our server, which queries the BAN (adresse.data.gouv.fr) to suggest municipalities.",
    privacyIp:
      "The connection IP is used for a short-lived rate limit (Postgres), to keep public APIs usable.",
    privacyCookie:
      "A language cookie (eau-robinet-locale) stores FR or EN for one year. SameSite=Lax; Secure on HTTPS.",
    privacyLogs:
      "Technical errors may be sent to Sentry (message, URL, no water-quality payload). Container logs may go to Datadog if that agent runs on the VPS.",
    privacyContact:
      "To ask for deletion of server-side data that might concern you, contact the site publisher.",
  },
} as const;

type DeepString<T> = T extends string
  ? string
  : { [K in keyof T]: DeepString<T[K]> };

export type Messages = DeepString<typeof en>;
