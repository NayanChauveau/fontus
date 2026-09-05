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

DNS : `fontus.fr` (et `www` en CNAME) vers l’IP du VPS. Traefik + Let’s Encrypt s’occupent du certificat (apex et www). `https://www.$TRAEFIK_HOST` redirige en 301 vers `https://$TRAEFIK_HOST` (chemin et query conservés).

## Migrations

Le deploy applique `supabase/migrations/` via `psql` dans Postgres (`scripts/apply-prod-migrations.sh`). Le conteneur `web` les réapplique au démarrage si le package `postgres` est dans l’image (`create table if not exists`). `/api/health` dit si le schéma est là.

Health : `https://$TRAEFIK_HOST/api/health`

## Sentry

Les erreurs API / UI partent vers Sentry si `SENTRY_DSN` est dans le `.env` du VPS (secret GitHub du même nom). Le plan Developer gratuit envoie un mail sur chaque nouvelle issue.

Le `.env` n’est créé qu’une fois : après avoir collé le DSN dans GitHub, soit attendre le prochain deploy (il met à jour `SENTRY_DSN`), soit le poser à la main :

```bash
# /srv/eau-robinet/.env
SENTRY_DSN=https://xxxx@o….ingest.sentry.io/…
cd /srv/eau-robinet
docker compose -f docker-compose.prod.yml up -d --no-deps --force-recreate web
```

Vérifier que le process a le DSN et qu’un event arrive dans Issues :

```bash
curl -sS -X POST https://fontus.fr/api/sentry-check
# {"ok":true,"configured":true}
```

`configured: false` = le conteneur n’a pas le DSN. Pas de Session Replay : on n’envoie que le message et des tags (scope, event).

Le workflow **Deploy** compile l’image sur GitHub Actions (réseau npm + cache `gha`), la pousse vers `ghcr.io/<owner>/<repo>:<sha>` (et `:main`), puis le VPS fait `docker login` + `pull` + `up web`. Pas de nouveau secret : `GITHUB_TOKEN` suffit (`permissions.packages: write`).

Le type-check Next est sauté dans l’image (`DOCKER_BUILD=1`) : le job CI le fait déjà. Postgres n’est pas recréé à chaque fois.

Secours sur le VPS, sans GitHub :

```bash
cd /srv/eau-robinet
export WEB_IMAGE=fontus-web:local
docker compose -f docker-compose.prod.yml build web
docker compose -f docker-compose.prod.yml up -d --no-deps --force-recreate web
```

## Chauffe des pages ville

Après un deploy, le premier crawl des pages `/eau-robinet/…` peut attendre Hub’Eau (surtout les UDI parisiennes). Script **manuel**, pas de cron :

```bash
# depuis le repo, contre le site déjà en ligne
node scripts/warm-city-pages.mjs --origin https://fontus.fr

# optionnel : chauffer aussi chaque page UDI (plus long)
node scripts/warm-city-pages.mjs --origin https://fontus.fr --quality --pause 2000
```

Le script lit le hub, suit les 50 villes, puis éventuellement les liens UDI. Pause par défaut 1,5 s.

Dans Google Search Console (propriété `fontus.fr`), soumettre `https://fontus.fr/sitemap.xml` après le premier deploy des pages ville. La chauffe n’indexe rien toute seule : elle évite seulement un premier hit à froid.

## Nouveau site plus tard

Copier `docker-compose.prod.yml`, changer le `Host`, le nom du router, et le dossier `/srv/…`.
