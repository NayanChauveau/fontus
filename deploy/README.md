# Prod (VPS Hostinger + Traefik)

Même recette que `jojo_portfolio` : réseau Docker `traefik` (repo `infra-traefik` dans `/srv/traefik`), Compose à la racine, deploy SSH vers `/srv/eau-robinet`.

## Une fois sur le VPS

```bash
docker network ls | grep traefik
# si absent : cd /srv/traefik && docker compose up -d
```

Clé deploy : `~/.ssh/eau_robinet_deploy` (read-only sur le repo GitHub).

Secrets GitHub (comme jojo) : `SSH_HOST`, `SSH_PORT`, `SSH_USER`, `SSH_KEY`, `SSH_PASSPHRASE`, plus `POSTGRES_PASSWORD`, `TRAEFIK_HOST=fontus.fr`, `SENTRY_DSN`, `DATABASE_URL` :

```
postgresql://postgres:MOTDEPASSE@postgres:5432/fontus
```

DNS : `fontus.fr` (et `www` en CNAME) vers l’IP du VPS. Traefik + Let’s Encrypt s’occupent du certificat.

## Migrations

Le deploy applique `supabase/migrations/` via `psql` dans Postgres (`scripts/apply-prod-migrations.sh`). Le conteneur `web` les réapplique au démarrage si le package `postgres` est dans l’image (`create table if not exists`). `/api/health` dit si le schéma est là.

Health : `https://$TRAEFIK_HOST/api/health`

Le workflow **Deploy** compile l’image sur GitHub Actions (réseau npm + cache `gha`), la pousse vers `ghcr.io/<owner>/<repo>:<sha>` (et `:main`), puis le VPS fait `docker login` + `pull` + `up web`. Pas de nouveau secret : `GITHUB_TOKEN` suffit (`permissions.packages: write`).

Le type-check Next est sauté dans l’image (`DOCKER_BUILD=1`) : le job CI le fait déjà. Postgres n’est pas recréé à chaque fois.

Secours sur le VPS, sans GitHub :

```bash
cd /srv/eau-robinet
export WEB_IMAGE=fontus-web:local
docker compose -f docker-compose.prod.yml build web
docker compose -f docker-compose.prod.yml up -d --no-deps --force-recreate web
```

## Nouveau site plus tard

Copier `docker-compose.prod.yml`, changer le `Host`, le nom du router, et le dossier `/srv/…`.
