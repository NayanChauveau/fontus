# Catalog files and versioning

## Files

| Catalog | File | Jurisdictions |
|---------|------|----------------|
| fr-eu | `src/modules/norms/domain/frEuCatalog.ts` | `fr`, `eu` (`pair()` writes both) |
| ch | `src/modules/norms/domain/chCatalog.ts` | `ch` |
| us | `src/modules/norms/domain/usCatalog.ts` | `us` |
| who | `src/modules/norms/domain/whoCatalog.ts` | `who` |
| reviews | `src/modules/norms/domain/catalogReviews.ts` | `reviewedAt` only |
| tests | `ThresholdVersion.test.ts`, `createNormCatalog.test.ts`, comparison tests | dates matter |

The comparison engine reads **TypeScript seed** (`createNormCatalog(SEEDED_THRESHOLDS)`), not “whatever is in Postgres”. Postgres persist is a cache.

Never put thresholds in React.

## `ThresholdVersion`

```ts
id            // "{parameterId}:{jurisdiction}{suffix}" unique
parameterId   // existing canonical id only
jurisdiction  // fr | eu | ch | us | who
unit          // must match how Fontus stores the measurement after resolve
value         // number
valueMax      // only for operator "range"
operator      // lte | gte | range
kind          // legal_limit | quality_reference
binding       // true only for enforceable legal_limit
validFrom     // UTC date, inclusive
validTo       // UTC date, exclusive, or null
citation      // instrument + article/annex if useful
sourceUrl     // official URL
```

`findActiveThreshold` picks the matching row with the latest `validFrom` still active at the **sample** date.

Interval: `validFrom <= at < validTo`.

## How to change a number

Bad: edit `value` in place.

Good (lead FR/UE already does this):

```ts
...pair("lead", "µg/L", 10, {
  validTo: TIGHTEN_2036,
  suffix: ":10",
}),
...pair("lead", "µg/L", 5, {
  validFromFr: TIGHTEN_2036,
  validFromEu: TIGHTEN_2036,
  suffix: ":5",
}),
```

Same pattern on `ch()` / `us()` / `who()` with `suffix` / `validFrom` / `validTo`.

## Kind cheat-sheet

| Instrument | kind | binding |
|------------|------|---------|
| FR/UE parametric value (annex I part B) | `legal_limit` | `true` |
| FR/UE indicator (annex I part C) | `quality_reference` | `false` |
| CH OPBD annex 2 maximum | `legal_limit` | `true` unless the text says indicator |
| US MCL | `legal_limit` | `true` |
| US action level, SMCL, MCLG | `quality_reference` | `false` |
| WHO guideline value | `quality_reference` | `false` |

If unsure whether a FR line is part B or C: quote the annex heading. Do not assume.

## Canonical `parameterId` already used

Reuse these. Do not create `no3`, `pb`, `lead-and-copper`.

`nitrates`, `nitrites`, `lead`, `arsenic`, `cadmium`, `chromium`, `chromium6`, `nickel`, `copper`, `mercury`, `ecoli`, `enterococci`, `atrazine`, `pesticides_total`, `aluminium`, `iron`, `fluoride`, `boron`, `selenium`, `antimony`, `uranium`, `cyanide`, `bromate`, `manganese`, `sodium`, `chloride`, `sulfate`, `ammonium`, `barium`, `ph`, `pfas20`, `pfoa`, `pfos`, `pfhxs`, `pfna`

New substance: add the parameter in the **parameters** module first (canonical unit, aliases), with tests. Out of scope for a review-only pass.

## Units

Hub’Eau / resolve may convert mg/L ↔ µg/L. The seed unit must be the **canonical** unit of that parameter (see parameter catalog), not a random unit from a PDF if it differs — convert with a quoted factor.

US nitrate: stored as mg/L NO3 (44.3), not 10 as N.

## Tests to extend on a change

- `src/modules/norms/domain/ThresholdVersion.test.ts` — date before / on `validFrom`
- `src/modules/norms/domain/createNormCatalog.test.ts` if a new jurisdiction pairing is added
- Comparison tests if `kind` / strict minimum legal_limit set changes

## `reviewedAt`

UTC calendar date `YYYY-MM-DD`. Bump only catalogs whose official page was fetched this session. CI fails if any stamp is older than 30 days (`CATALOG_REVIEW_MAX_AGE_DAYS`).
