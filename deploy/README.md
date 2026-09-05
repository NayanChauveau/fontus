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

## Premier up + migrations

Après le premier `docker compose -f docker-compose.prod.yml up -d` :

```bash
cd /srv/eau-robinet
docker compose -f docker-compose.prod.yml exec -T postgres \
  psql -U postgres -d fontus < supabase/migrations/20260902120000_network_cache.sql
# puis les autres fichiers de supabase/migrations/ dans l’ordre
```

Health : `https://$TRAEFIK_HOST/api/health`

Le premier `docker compose build` sur le VPS peut dépasser 10 min (npm + `next build`). Le workflow SSH a un `command_timeout` de 40 min. Le type-check Next est sauté dans l’image (`DOCKER_BUILD=1`) : le job CI le fait déjà.

## Nouveau site plus tard

Copier `docker-compose.prod.yml`, changer le `Host`, le nom du router, et le dossier `/srv/…`.
