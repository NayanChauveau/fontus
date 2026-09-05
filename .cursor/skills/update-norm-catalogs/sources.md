# Official sources (only these)

Use **WebFetch / WebSearch** on these hosts. Prefer the consolidated in-force text, not a blog summary.

If a link redirects, keep the **final official URL** in `sourceUrl` / `citation`.

## fr-eu

| Role | URL |
|------|-----|
| FR arrêté EDCH (seed `sourceUrl`) | https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000046879740 |
| Search later amending arrêtés | https://www.legifrance.gouv.fr/ (query: eaux destinées à la consommation humaine) |
| UE directive 2020/2184 | https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32020L2184 |
| EUR-Lex HTML / annex I | same CELEX, open the **annex** tables, not only the recitals |

Also check whether a newer JORF text **replaces** the 30 décembre 2022 arrêté. If yes, new `FR_CITATION` / `FR_URL` and version affected rows.

PFAS-20 0.1 µg/L and lead 5 µg/L / chromium 25 µg/L (2036) are already dated in `frEuCatalog.ts`. Confirm against the **in-force** annex, not a press release.

## ch

| Role | URL |
|------|-----|
| OPBD RS 817.022.11 | https://www.fedlex.admin.ch/eli/cc/2017/163/fr |
| OSAV PFAS | https://www.blv.admin.ch/fr/pfas-fr |
| RO 2026 369 (lead/chromium from 2026-08-01) | https://www.fedlex.admin.ch/eli/oc/2026/369/fr |

Use the **consolidated** OPBD (eli/cc/…) for current annex 2. Use RO/OC only to date an amendment.

Do **not** seed OSAV consultation values.

## us

| Role | URL |
|------|-----|
| NPDWR table | https://www.epa.gov/ground-water-and-drinking-water/national-primary-drinking-water-regulations |
| eCFR 40 CFR 141 | https://www.ecfr.gov/current/title-40/chapter-I/subchapter-D/part-141 |
| PFAS NPDWR | https://www.epa.gov/sdwa/and-polyfluoroalkyl-substances-pfas |

- Seed **MCL** (or equivalent enforceable standard), not MCLG.
- Lead / copper: **action level** → `quality_reference`, `binding: false` (already documented in `usCatalog.ts`).
- Nitrate / nitrite: CFR is **as N**. Fontus stores as NO3 / NO2 with factors **4.43** and **3.28** already in the citation. Do not change the factor unless the CFR or a cited EPA conversion changes — and then quote it.
- A **proposed** rescission is not a repeal. Keep the MCL until a **final** rule is in the Federal Register / eCFR.

## who

| Role | URL |
|------|-----|
| GDWQ 4th ed. + addenda | https://www.who.int/publications/i/item/9789240045064 |
| WHO publications search | https://www.who.int/publications |

- All WHO rows are `quality_reference`, `binding: false`.
- Do not seed unpublished or “provisional guideline under consultation” PFAS GVs (see comment in `whoCatalog.ts`).
- Prefer the **guideline value** table in the latest addendum over a secondary WHO fact sheet.

## Fetch discipline

1. Record the URL actually fetched (after redirects).
2. If the body is a PDF: extract the table row; if extraction fails, stop (`blocked`).
3. Ignore news sites, ChatGPT-style summaries, and Hub’Eau / ARS pages — they are measurements, not legal limits.
4. Language: FR texts in French, CFR in English, WHO in English (or official FR if you fetched that file).
