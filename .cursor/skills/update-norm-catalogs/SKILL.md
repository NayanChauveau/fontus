---
name: update-norm-catalogs
description: >-
  Reviews and updates Fontus drinking-water threshold catalogs (FR, EU, CH, US, WHO)
  from official legal texts only. Use when catalogReviews CI fails, when the user
  asks to update normes / seuils / lois / OMS / WHO / EPA / OPBD / arrêté EDCH /
  directive 2020/2184, or when adding a ThresholdVersion. Never invent numeric limits.
---

# Update Fontus norm catalogs

Drinking-water limits are **legal facts**. A wrong number on Fontus is worse than a stale review date.

## Hard rules

1. **No number from memory, training data, Wikipedia, press, or another AI.** Every `value` / `valueMax` / unit / `validFrom` must come from a page you fetched in this session.
2. If you cannot open the official text or cannot find the exact line: **stop**. Say what is missing. Do **not** guess, interpolate, or “keep the old value because it is probably still right” without fetching.
3. **Drafts, consultations, bills, proposed rules, “guidelines under discussion” are not in force.** Do not seed them. Mention them in the report only.
4. **Do not overwrite a version.** Close it with `validTo` and add a new row (`suffix` on the id). Historical samples must keep the law of their sampling date.
5. WHO / quality references are never `legal_limit`. US MCLG and Lead/Copper **action levels** are not MCL prohibitions (`quality_reference`, `binding: false`).
6. Do not `git commit` or `git push`.

## When this runs

- CI test `catalog review freshness` failed (`listStaleCatalogReviews`).
- User asked to refresh normes / catalogs.

A **review with no legal change** is valid: open the four sources, confirm the seed still matches, bump `reviewedAt` only.

## Parallel work

Launch **one agent per catalog** (`fr-eu`, `ch`, `us`, `who`). Each agent:

- fetches **only** its official URLs (see [sources.md](sources.md));
- returns a structured report (template below);
- **does not edit files** unless you are the merge agent.

The parent / merge agent:

- rejects any report without a verbatim quote + URL + access date;
- applies edits;
- runs `pnpm test` (must include `catalogReviews` + `ThresholdVersion` + comparison tests).

## Workflow

Copy and tick:

```
- [ ] Read current catalogs and catalogReviews.ts
- [ ] Fetch official texts (this session)
- [ ] Quote the exact article / annex / table for every change or confirmation
- [ ] Decide: no change | version the seed | do not seed (not in force)
- [ ] Edit catalogs only with quoted values
- [ ] Add / update tests at dates before and after validFrom / validTo
- [ ] Set reviewedAt to today's UTC date (YYYY-MM-DD) for catalogs actually opened
- [ ] pnpm type-check && pnpm lint && pnpm test
```

### Review-only (CI unblock, law unchanged)

1. Fetch each `sourceUrl` in `src/modules/norms/domain/catalogReviews.ts`.
2. Spot-check the parameters already in that catalog (nitrates, lead, PFAS if present) against the live text.
3. If anything differs → treat as a **change**, not review-only.
4. If identical → bump that catalog’s `reviewedAt` to today UTC.
5. Do not bump a catalog you did not open.

### Change (new or amended limit)

See [catalogs.md](catalogs.md) for files, ids, and `ThresholdVersion` fields.

1. Identify jurisdiction, `parameterId` (existing canonical id only; new substance = new parameter seed + tests, do not invent ids).
2. Quote: value, unit (as in the text), entry-into-force date, kind (limit vs indicator / guide / action level).
3. Convert units only with an **explicit factor written in the official text or a documented conversion already in the catalog** (example: US nitrate “as N” → NO3 in `usCatalog.ts`). Write the factor in `citation`.
4. Close the previous version: `validTo` = new `validFrom` (half-open interval: old is active while `at < validTo`).
5. New id: `{parameterId}:{jurisdiction}{suffix}` e.g. `lead:fr:5`.
6. Tests: sample date the day before `validFrom` → old value or `null`; on `validFrom` → new value.

## Report template (required)

Each catalog agent must end with:

```
## Catalog: fr-eu | ch | us | who
- Fetched: <absolute official URL>
- Accessed: <YYYY-MM-DD>
- In-force instrument: <title + date>
- Verdict: unchanged | changed | blocked (cannot verify)

### Quotes
- <parameter>: "<verbatim excerpt>" — <article/annex> — value <n> <unit>

### Seed actions
- none | list of ids to close / add

### Not seeded (and why)
- drafts, MCLG, missing parameter in Fontus, unreadable PDF, …
```

## Gate

Do not declare done if:

- a value was typed without a quote from this session’s fetch;
- `reviewedAt` was bumped for a catalog not opened;
- `pnpm test` was not run.

## Files

- Reviews: `src/modules/norms/domain/catalogReviews.ts`
- Seeds: `frEuCatalog.ts`, `chCatalog.ts`, `usCatalog.ts`, `whoCatalog.ts`
- Combined: `seededThresholds.ts`
- Details: [sources.md](sources.md), [catalogs.md](catalogs.md)
