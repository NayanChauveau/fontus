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

## Passage à Postgres 18 (novembre 2026)

La base passe de Postgres 16 à 18 par le workflow manuel **Postgres 18 upgrade** (`.github/workflows/postgres-18-upgrade.yml`, script `scripts/postgres-18-upgrade.sh`). Le compose de prod utilise déjà Postgres 18 sur le volume externe `eau-robinet_pgdata18` : tant que la bascule n’est pas faite, un déploiement habituel échoue (« external volume not found ») au lieu de démarrer une base vide, et les conteneurs en cours ne sont pas touchés.

1. **Répétition** (sans risque, le site reste en ligne) : lancer le workflow avec `mode = rehearsal`. Il copie la prod dans un Postgres 18 jetable, compare le nombre de lignes de chaque table, applique les migrations sur la copie, puis supprime la copie.
2. **Snapshot Hostinger** du VPS depuis hPanel, juste avant la bascule.
3. **Bascule** : `mode = cutover`, cocher `snapshot_done`. Le script tourne détaché sur le VPS (une coupure SSH ou l’annulation du job ne l’interrompt pas) ; son journal est dans `/srv/backups/eau-robinet/*-cutover.log`. Coupure du site d’environ 1 à 2 minutes : arrêt de `web`, export dans `/srv/backups/eau-robinet/`, import dans `eau-robinet_pgdata18`, comparaison des lignes, puis Compose redémarre `postgres` en 18, applique les migrations et relance `web`, et `/api/health` doit répondre 200.
   - Toute erreur, interruption ou coupure **avant** la bascule relance `web` sur Postgres 16 et supprime le volume 18 en cours de création.
   - Toute erreur **après** la bascule remet automatiquement Postgres 16 sur son ancien volume (avec le compose 16 sauvegardé dans `/srv/backups/eau-robinet/compose-postgres16.yml`) et garde le volume 18 pour analyse. Avant de relancer une bascule, ce volume 18 doit être supprimé (`docker volume rm eau-robinet_pgdata18`, sur décision explicite).
   - Le script refuse de démarrer si le mot de passe de `DATABASE_URL` (`.env`) diffère de celui de Postgres : l’appli ne pourrait pas se connecter à la nouvelle base.
4. **Vérifier** : `https://fontus.fr` répond, `/api/health` indique `postgres: ok`.

**Retour arrière plus tard** (problème découvert après coup) : relancer le workflow avec `mode = rollback`. Postgres 16 redémarre sur l’ancien volume `eau-robinet_pgdata`, intact, avec le compose 16 sauvegardé ; `web` est relancé. Les données écrites sur Postgres 18 depuis la bascule ne sont pas reprises (elles se réimportent depuis Hub’Eau / data.gouv). Ensuite, `git revert` du commit qui a passé le compose en Postgres 18, pour que le prochain déploiement reste en 16. En dernier recours : l’export dans `/srv/backups/eau-robinet/`, puis le snapshot Hostinger.

Ne supprimer `eau-robinet_pgdata` et les exports qu’après plusieurs jours sans problème, sur décision explicite.

Tester le script en local (Docker uniquement, ne touche jamais la prod) :

```bash
bash scripts/test-postgres-18-upgrade.sh
```

## Sentry

Les erreurs API / UI partent vers Sentry si `SENTRY_DSN` est dans le `.env` du VPS (secret GitHub du même nom). Le plan Developer gratuit envoie un mail sur chaque nouvelle issue.

Le `.env` n’est créé qu’une fois : le deploy met ensuite à jour `SENTRY_DSN`. Pas de Session Replay : on n’envoie que le message et des tags (scope, event).

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
