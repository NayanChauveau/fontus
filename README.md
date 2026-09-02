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

- `/` : autocomplete d’adresse (Géoplateforme) → commune + code INSEE
- `/api/addresses/suggest?q=` : suggestions
- `/api/addresses/resolve` : confirmation d’une suggestion
- `/api/health` : `{ status, postgres, checkedAt }`

## Quality gate

```bash
pnpm type-check && pnpm lint && pnpm test
```

Architecture : [`docs/architecture.md`](docs/architecture.md).
