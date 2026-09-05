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
    breadcrumb: "Breadcrumb",
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
    howToRead: "How to read an analysis",
    faq: "FAQ",
    glossary: "Glossary",
    pfas: "PFAS",
    nitrates: "Nitrates",
    lead: "Lead",
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
  pages: {
    cta: "See the analyses for your municipality",
    limitCurrent: "French legal limit in force: {{value}}.",
    limitSource: "Source: {{citation}}.",
    limitUpcoming:
      "From {{date}}, the same texts provide for a limit of {{value}}.",
    how: {
      title: "How to read a tap water analysis",
      description:
        "Understand an official ARS analysis: legal conclusion, LOQ, compliance, PFAS-20 and the FR, EU, CH, US and WHO columns.",
      arsTitle: "The ARS conclusion: the legal verdict",
      arsBody:
        "The ARS banner is the official conclusion for that sample. Fontus reproduces it and does not recalculate it. A green or red comparison table on this site does not replace that verdict.",
      limitsTitle: "Bacteriological and physico-chemical limits",
      limitsBody:
        "The sanitary control distinguishes bacteriological limits (for example Escherichia coli and enterococci) from physico-chemical limits (nitrates, metals, pesticides, PFAS, and so on). A non-compliant result on either side is reported in the official conclusion.",
      valueTitle: "Value, LOQ and compliance",
      valueBody:
        "The published result may be a number or “below the limit of quantification” (LOQ): the laboratory cannot quantify the substance below that threshold. Compliance is judged against the French standard applicable on the sampling date, not against a later change of the law.",
      pfasTitle: "PFAS-20 versus individual PFAS",
      pfasBody:
        "In France and the EU, individual PFAS such as PFOA or PFOS have no legal limit: only the PFAS-20 sum is regulated. Switzerland and the United States set some individual limits. WHO has no adopted PFAS guideline value yet.",
      datesTitle: "Why dates differ by parameter",
      datesBody:
        "Each parameter keeps the date of its latest measurement. PFAS campaigns are often separate from the latest routine check. Watch cards may therefore come from another sampling campaign than the ARS conclusion at the top of the page.",
      compareTitle: "FR, EU, CH, US and WHO columns",
      compareBody:
        "The French column is the legal reference for a network in France. EU, Swiss and US columns are foreign legal comparisons. The WHO column uses guideline values, not legal limits. The “Strictest” column is a Fontus metric, not an official standard.",
      contactTitle: "When to contact your town hall or ARS",
      contactBody:
        "For a restriction, a non-compliant conclusion, or a health question, contact your ARS or your drinking-water operator. Fontus does not give medical advice and does not say whether the water is “good”.",
    },
    faq: {
      title: "Frequently asked questions about tap water",
      description:
        "UDI, official analyses, PFAS, nitrates, lead, and what Fontus does not replace.",
      potableQ: "Is tap water potable?",
      potableA:
        "Fontus does not answer that in place of the ARS. Open your municipality, read the official conclusion for your distribution unit (UDI), and follow the instructions of your ARS or operator if a restriction is in force.",
      udiQ: "How do I know which network (UDI) is mine?",
      udiA:
        "The simplest way is the annual ARS sheet on your water bill: it names the distribution unit. You can also compare the 9-digit code or the network name with the ministry website, then select the matching network on Fontus.",
      whereQ: "Where can I find analyses for my municipality?",
      whereA:
        "Enter your address on Fontus to open the official Hub’Eau / SISE-Eaux analyses. The ministry website remains the official public entry point.",
      paramsQ: "What do nitrates, PFAS and lead mean?",
      paramsA:
        "They are among the parameters of the sanitary control of drinking water. Fontus shows the latest measurement and the French standard, plus foreign comparisons. Dedicated pages explain each topic without replacing the ARS conclusion.",
      officialQ: "Does Fontus replace the ministry or ARS website?",
      officialA:
        "No. Fontus is a personal comparison layer on open data. The legal verdict remains the ARS conclusion. In a doubt, use the official sites and contact your ARS.",
      freshQ: "Are the data up to date?",
      freshA:
        "Fontus displays the latest campaigns published by Hub’Eau (SISE-Eaux). The date shown is the sampling date of each parameter, which can differ from one substance to another.",
      drinkQ: "Can I drink the water if a parameter exceeds the standard?",
      drinkA:
        "Fontus does not give that advice. Read the ARS conclusion for the sample and, if needed, ask your ARS, your operator or a health professional.",
    },
    glossary: {
      title: "Tap water glossary",
      description:
        "UDI, INSEE, LOQ, PFAS-20, hydrometric title, SISE-Eaux, Hub’Eau, legal limit and quality reference.",
      udiTerm: "UDI",
      udiDef:
        "Internal distribution unit: the network that serves your tap. It has a 9-digit code. A municipality may have several UDIs (districts, successive years).",
      inseeTerm: "INSEE code",
      inseeDef:
        "Official identifier of a French municipality. Fontus uses it to list the distribution networks attached to that commune.",
      lqTerm: "LOQ",
      lqDef:
        "Limit of quantification: below this threshold the laboratory reports a non-quantified result (often written “< LOQ”). That is not the same as a zero.",
      pfas20Term: "PFAS-20",
      pfas20Def:
        "Regulated sum of twenty per- and polyfluoroalkyl substances. In France and the EU, this sum is the legal PFAS limit; individual PFAS have no French legal limit.",
      thTerm: "TH (hydrometric title)",
      thDef:
        "Measure of water hardness (calcium and magnesium). France has no legal limit for TH; it is an indicator of scale, not a potability verdict.",
      siseTerm: "SISE-Eaux",
      siseDef:
        "National information system for the sanitary control of water intended for human consumption, used by the ARS.",
      hubeauTerm: "Hub’Eau",
      hubeauDef:
        "Public API that publishes SISE-Eaux data. It is the source of the measurements shown on Fontus.",
      legalTerm: "Legal limit",
      legalDef:
        "Binding maximum (or range) in the applicable regulation. A result above that limit is non-compliant.",
      qualityTerm: "Quality reference",
      qualityDef:
        "Non-binding indicator (for example aluminium or iron). An exceedance is not by itself a legal non-compliance.",
    },
    pfas: {
      title: "PFAS in tap water in France",
      description:
        "What PFAS and the PFAS-20 sum are, the French legal limit taken from the official catalog, and how to check your municipality.",
      whatTitle: "What are PFAS?",
      whatBody:
        "PFAS are per- and polyfluoroalkyl substances, sometimes called “forever chemicals”. The sanitary control can report individual substances (PFOA, PFOS, and others) and a regulated sum of twenty of them (PFAS-20).",
      limitTitle: "French regulation",
      compareTitle: "International comparisons on Fontus",
      compareBody:
        "The tool also shows Swiss and US individual limits when they exist, and the WHO column when a guideline value exists. Those columns do not replace the ARS conclusion in France.",
    },
    nitrates: {
      title: "Nitrates in tap water",
      description:
        "Nitrates in drinking water, the French legal limit taken from the official catalog, and how to check your municipality.",
      whatTitle: "What are nitrates?",
      whatBody:
        "Nitrates are nitrogen compounds often linked to agriculture and sanitation. They are a routine parameter of the sanitary control of drinking water.",
      limitTitle: "French regulation",
      compareTitle: "See the level in your municipality",
      compareBody:
        "Fontus shows the latest official measurement for your UDI and compares it with the French standard and foreign references. The ARS banner remains the legal verdict.",
    },
    lead: {
      title: "Lead in tap water",
      description:
        "Lead at the tap, the French legal limit taken from the official catalog, including the later tightening already versioned, and how to check your municipality.",
      whatTitle: "Where does lead come from?",
      whatBody:
        "Lead in tap water often comes from old service pipes or indoor plumbing, not from the resource. The sanitary control reports the concentration measured at the tap or at a representative point of the network.",
      limitTitle: "French regulation",
      compareTitle: "See the level in your municipality",
      compareBody:
        "Fontus shows the latest official lead measurement for your UDI. A result below the legal limit is not a medical opinion. For a health question, contact your ARS or a health professional.",
    },
  },
} as const;

type DeepString<T> = T extends string
  ? string
  : { [K in keyof T]: DeepString<T[K]> };

export type Messages = DeepString<typeof en>;
