# Architecture — eau-robinet

DDD + hexa stricte, calquée sur Breatheline / apnee. Le frontend Next.js ne parle jamais à Hub’Eau, Drizzle ou Supabase.

## Couches

| Couche | Emplacement | Responsabilité |
|--------|-------------|----------------|
| UI | `src/app/`, `src/components/` | Pages App Router, route handlers HTTP |
| Presentation | `src/presentation/` | View-models, i18n, mappers DTO → VM |
| Application | `src/application/` | Use cases, DTOs, ports, errors |
| Composition | `src/composition/` | `createApp()`, adapters de ports |
| Modules | `src/modules/*/` | Bounded contexts (à partir de I1) |
| Shared infra | `src/shared/infrastructure/` | Client Postgres / env |

## Flux des dépendances

```
UI → ensureApplication().*UseCase → DTOs
UI → presentation mappers → view-models
Application → Ports (interfaces + DTOs purs)
Composition → Adapters → Modules / shared infra
Presentation → Application (DTOs)
Shared → jamais Application
```

`src/app` n’importe jamais `drizzle-orm`, `postgres`, ni un client HTTP Hub’Eau / GeoPF.

## Observabilité

`ObservabilityPort.report` est le seul point de sortie des erreurs (routes, use cases qui dégradent, cache). En local : dump lisible sur stderr. En prod : une ligne JSON (prête pour Datadog plus tard). On ne persiste pas les erreurs en base.

## Bootstrap Next.js

Les Server Components et route handlers appellent `ensureApplication()` (`src/composition/bootstrap.ts`), qui initialise une fois `createApp()` puis délègue à `getApplication()`.

Les tests unitaires instancient les use cases avec `createFakeApplicationPorts()`.

## I0

Un seul port santé : `HealthPort.ping()` (`select 1` via Drizzle). Use case : `HealthCheckUseCase`.

## I1

Module `geocoding` : Géoplateforme `/search` (pas `/completion`, qui n’expose pas `citycode`).

- Ports : `GeocodingPort.suggest` / `resolve`
- Use cases : `SuggestAddressesUseCase`, `ResolveAddressUseCase`
- HTTP : `GET /api/addresses/suggest?q=`, `POST /api/addresses/resolve`
- L’UI n’appelle jamais GeoPF ; le navigateur passe par les route handlers

## I2

Module `network` : Hub’Eau `communes_udi` + cache Postgres 7 jours + confidence.

- `exact` seulement si 1 UDI pour la commune ; sinon `ambiguous` (jamais `probable`)
- Arrondissements BAN (Paris / Lyon / Marseille) → code commune Hub’Eau (75056 / 69123 / 13055)
- Les UDI portuaires / industrielles sont masquées pour une adresse d’habitation ; on ne choisit toujours pas un réseau unique si plusieurs UDI urbaines restent
- On ne montre jamais une liste vide : échec technique plutôt que « aucun réseau »
- Aucun réseau n’est sélectionné par défaut
- Use case : `ListDistributionNetworksUseCase`
- HTTP : `GET /api/networks?citycode=`

## I3

Module `analyses` : Hub’Eau `resultats_dis` + cache Postgres 7 jours + parse LQ.

- Toujours `code_reseau` + fenêtre de dates ; jamais paginer une commune entière
- Fenêtre : on sonde 6 → 36 mois et on garde la plus longue sous 10k (dur 20k) ; un timeout Hub’Eau ne masque pas une fenêtre plus courte
- `< LQ` reste du texte (`<0,01`) : `resultat_numerique: 0.0` n’est pas un zéro
- On affiche la conclusion ARS du dernier prélèvement, on ne la recalcule pas
- Use case : `GetNetworkWaterQualityUseCase`
- HTTP : `GET /api/udi/:code/quality`

## I4

Module `parameters` : dictionnaire canonique + alias SANDRE / SISE / CAS + conversion d’unités.

- Seed prioritaire (PFAS, nitrates, métaux, microbio, pesticides…) ; les autres codes vus sont importés (`unlisted:{code}`)
- Priorité d’affichage ≠ périmètre d’import
- Deux libellés / codes de la même substance → un `canonical_id` (`1340` et `NO3` → `nitrates`)
- Conversion mg/L ↔ µg/L avant tout seuil ; `< LQ` reste une limite, pas zéro
- `<SEUIL` PFAS-20 n’est pas un chiffre : borne haute reconstruite à partir des 20 substances du même prélèvement
- Tableau = dernière valeur **par paramètre** (les campagnes PFAS ont souvent une autre date que le dernier contrôle courant)
- Use case : `GetNetworkWaterQualityUseCase` enrichit les mesures via `ParametersPort.resolve`

## I5

Modules `norms` + `comparison` : seuils FR/UE versionnés + moteur à la date du prélèvement.

- Seed cité (directive (UE) 2020/2184, arrêté du 30 décembre 2022) ; jamais de seuil dans React
- Statuts : `compliant` | `exceedance` | `below_loq` | `not_comparable` | `no_threshold`
- `< LQ` sous le seuil = conforme ; LQ au-dessus du seuil = `below_loq`
- `quality_reference` n’est jamais une `legal_limit` ; le bandeau ARS n’est pas recalculé
- Use case : `GetNetworkWaterQualityUseCase` enchaîne `ParametersPort.resolve` puis `ComparisonPort.compare`

## I6

Juridictions CH (OPBD / OSAV) et US (EPA NPDWR) + référence stricte du site.

- Seeds cités ; jamais de seuil dans React
- Référence stricte = plus basse `legal_limit` comparable (`lte`, même unité) parmi FR / UE / CH / US
- Ce n’est pas une norme officielle : pas de score, reco EPA (action level, MCLG) ≠ interdiction
- Use case : `CompareMeasurements` enrichit chaque mesure avec `fr` / `eu` / `ch` / `us` / `strict`

Modules suivants : I7 (cartes).
