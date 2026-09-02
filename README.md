# eau-robinet

Site de comparaison de la qualité de l’eau du robinet. Scaffold Next.js + hexa + Supabase local.

## Prérequis

- Node 22+
- pnpm (`packageManager` dans `package.json`)
- Docker (Supabase local ; ports décalés de +10 pour ne pas collisionner avec un autre projet : Postgres `54332`)

## Démarrer

```bash
cp .env.example .env.local
pnpm supabase:start
pnpm dev
```

App sur **http://localhost:3100** (pas 3000).

- `/` : adresse → commune / INSEE → réseaux UDI → bandeau ARS, cartes prioritaires, comparaison FR/UE/CH/US
- `/api/addresses/suggest?q=` : suggestions
- `/api/addresses/resolve` : confirmation d’une suggestion
- `/api/networks?citycode=` : UDI de la commune (cache 7 jours)
- `/api/udi/:code/quality` : dernier prélèvement du réseau, mesures résolues + comparaison FR/UE/CH/US et référence stricte (métrique du site)
- `/api/health` : `{ status, postgres, checkedAt }`

## Quality gate

```bash
pnpm type-check && pnpm lint && pnpm test
```

Architecture : [`docs/architecture.md`](docs/architecture.md).

Les erreurs applicatives (503 Hub’Eau, dégradations, crash UI) passent par `ObservabilityPort` et sortent sur stderr (lisible en local, JSON en prod). Rien n’est stocké en base ; Datadog se branchera plus tard sur ces logs.
