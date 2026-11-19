# Fontus

Site de comparaison de la qualité de l’eau du robinet (`fontus.fr`). Scaffold Next.js + hexa + Supabase local. Le dépôt git s’appelle encore `eau-robinet`.

## Prérequis

- Node 22+
- pnpm (`packageManager` dans `package.json`)
- Docker (Supabase local ; ports décalés de +10 pour ne pas collisionner avec un autre projet : Postgres `54332`)

## Démarrer

```bash
cp .env.example .env.local
pnpm supabase:start
# After pulling new SQL: apply `supabase/migrations/` (or `pnpm supabase db reset`)
pnpm dev
```

App sur **http://localhost:3100** (pas 3000).

- `/` : adresse → commune / INSEE → réseaux UDI → bandeau ARS, cartes, historique, comparaison FR/UE/CH/US, toutes les analyses + provenance
- `/api/addresses/suggest?q=` : suggestions
- `/api/addresses/resolve` : confirmation d’une suggestion
- `/api/networks?citycode=` : UDI de la commune (cache 7 jours)
- `/api/udi/:code/quality` : dernier prélèvement, comparaison FR/UE/CH/US + stricte, et historique nitrates / PFAS-20 / plomb (min / médiane / max, tendance)
- `/api/health` : `{ status, postgres, schema, detail, checkedAt }`

Socle de sécurité commun aux sites (déploiement, conteneur, CSP, journaux) : `docs/security-baseline.md` du dépôt `infra-traefik`.

## Quality gate

```bash
pnpm type-check && pnpm lint && pnpm test
```

Tests navigateur sur le build de production (Chromium de Playwright, `pnpm exec playwright install chromium` une fois) :

- `pnpm test:e2e` : CSP, pages et parcours (`tests/e2e/csp.spec.ts`).
- `pnpm test:performance` : budget de performance Lighthouse (`lighthouse`, version exacte dans `package.json`) de `/`, `/eau-robinet/paris` et `/faq`, émulation mobile par défaut, médiane de 3 mesures par page (environ 1 min après le build). Budget (`tests/performance/budget.ts`) : performance ≥ 90, accessibilité et bonnes pratiques ≥ 95, SEO ≥ 90, LCP ≤ 2,5 s, CLS ≤ 0,1, poids ≤ 1 500 ko. Les appels de données sont servis par les fixtures enregistrées (`tests/e2e/fixtures`), comme pour la CSP. Une page hors budget fait échouer la commande et le job CI `performance` ; la table des médianes s’affiche dans le terminal et dans le résumé du job. La page ville a des plafonds d’exception motivés (règle P10a : liste des réseaux chargée après hydratation, CLS 0,217) à retirer une fois corrigée. `PERFORMANCE_RUNS=1` accélère une mesure exploratoire.

Quand Hub’Eau dépasse 20 000 lignes même sur 6 mois, on lit un extrait DIS local (`DIS_IMPORT_DIR` : fichiers `UDI_COM`, `PLV`, `RESULT` dézippés depuis [data.gouv](https://www.data.gouv.fr/datasets/resultats-du-controle-sanitaire-de-leau-distribuee-commune-par-commune)) et on écrit le même cache Postgres.

Architecture : [`docs/architecture.md`](docs/architecture.md).

En production : voir [`deploy/README.md`](deploy/README.md) (Traefik + Compose, même recette que jojo_portfolio). Le conteneur `web` applique `supabase/migrations/` au démarrage. Data API Supabase éteinte (ou RLS deny-all). SSL Postgres sauf loopback / nom Docker (`postgres`) ; `DATABASE_SSL=0` dans Compose.

Les erreurs passent par `ObservabilityPort` (stderr JSON en prod, Sentry si `SENTRY_DSN`). Les logs de conteneurs peuvent aller à Datadog si l’agent du VPS tourne.
