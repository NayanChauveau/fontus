# Prod (VPS Hostinger + Traefik)

Fontus se déploie avec le kit commun aux sites du VPS (le même que manon-karsenti) : `deploy/{release,site_config,dispatch,preflight,ssh_connection,smoke,backup}.py`, identiques octet pour octet dans chaque site (`deploy/KIT.sha256`, vérifié par `tests/test_kit_parity.py`). Ce qui est propre à Fontus vit dans `site.config.json`, `docker-compose.prod.yml` et le `Dockerfile`. Le réseau Docker `traefik` vient du repo `infra-traefik` (`/srv/traefik`).

Noms standard : projet compose `fontus-prod`, dossier `/srv/fontus`, volume de base `fontus-prod-pgdata18` (étiquette `fontus.owner=fontus-prod`), images `ghcr.io/nayanchauveau/fontus:<sha>` (web) et `:<sha>-ops` (migrations).

**Déploiement désactivé jusqu’à la bascule** (phase 2, tâche 6) : le job `deploy` ne tourne que si la variable de dépôt `PRODUCTION_DEPLOY_ENABLED` vaut `true`. Tant que la bascule n’a pas créé le volume étiqueté et `/srv/fontus/runtime.json`, une première release du kit démarrerait une base vide à côté du site en ligne (`/srv/eau-robinet`, projet `eau-robinet`, qui continue de servir). Les sauvegardes et la surveillance CI suivent la même variable.

## Déploiement (kit)

Un push sur `main` lance `Deploy production` : les tests (`ci.yml`), la construction des deux images (tags immuables, pas de `:main`), puis `deploy/preflight.py` (paramètres et secrets validés, aucune écriture) et `deploy/dispatch.py`, qui envoie par SSH une archive (liste blanche : compose, `release.py`, `site_config.py`, `site.config.json`, entrée de déploiement) et lance `release.py` sur le VPS. La release :

- refuse un volume existant sans l’étiquette `fontus.owner`, un volume manquant quand `runtime.json` existe, un secret qui change (`POSTGRES_PASSWORD` : la rotation se fait par une procédure dédiée), un secret avec un saut de ligne ;
- sauvegarde la base (`pg_dump -Fc` dans `/srv/fontus/backups/`), lance le job `migrate` (image ops, migrations SQL idempotentes) puis remplace le conteneur web sans coupure : le nouveau démarre à côté de l’ancien, Traefik ne l’utilise qu’une fois sain (`/api/health`), l’ancien reçoit `/tmp/draining` (`/api/ready` répond 503, Traefik l’écarte), puis s’arrête ; le middleware `fontus-retry` rejoue une requête retardataire. Si le nouveau n’est jamais sain (180 s, `deploy.timings`), il est supprimé et l’ancien continue de servir ;
- ajoute la redirection 301 `www.<hôte>` → `<hôte>` (routeur `fontus-www`, `deploy.wwwRedirect`) et, si `PRODUCTION_ALIASES` est défini, les redirections des alias ;
- vérifie ensuite le site en HTTPS et le site voisin (`https://manonkarsenti.com/api/health`), puis garde 5 sauvegardes locales, 5 releases et les images des 2 releases précédentes.

Les étiquettes Traefik du compose sont exactement celles des conteneurs déployés avant le kit (`tests/test_compose.py`) : pendant la bascule, l’ancien et le nouveau conteneur servent sous les mêmes noms de routeur et de service.

Paramètres GitHub (noms seulement, la liste complète est dans `site.config.json` → `github`) : secrets `POSTGRES_PASSWORD`, `SENTRY_DSN` (facultatif), `SSH_HOST`, `SSH_PORT`, `SSH_USER`, `SSH_KEY`, `SSH_PASSPHRASE`, `SSH_KNOWN_HOSTS` (lignes `ssh-keyscan` dont le premier champ correspond à `SSH_HOST`), `BACKUP_ENCRYPTION_KEY` (64 caractères hexadécimaux) ; variables `PRODUCTION_HOST` (`fontus.fr`), `PRODUCTION_DEPLOY_ENABLED`, `PRODUCTION_ALIASES` (facultatif). Les secrets `DATABASE_URL` et `TRAEFIK_HOST` ne servent plus (le kit calcule l’URL de la base ; l’hôte est une variable).

Tester les images en local (Docker seulement, ressources jetables `fontus-ci-*`) :

```bash
docker build --target production -t fontus:ci . && docker build --target ops -t fontus:ci-ops .
python3 deploy/smoke.py
python3 -m unittest discover -s tests -p 'test_*.py'
```

Le smoke (aussi lancé par le job CI `container`) démarre Postgres, lance `migrate` deux fois, démarre le web en lecture seule, vérifie l’UID 1001 et l’absence d’outils de build, les pages de `site.config.json` → `smoke.pages` (accueil, FAQ, robots, sitemap, image OG), un `pg_dump`, puis la persistance après recréation des conteneurs.

## Sauvegarde et surveillance

`Backup production` (chaque nuit) exporte la base par SSH, la chiffre (GnuPG, `BACKUP_ENCRYPTION_KEY`) et la garde 30 jours comme artefact GitHub. `Monitor production` (chaque heure) vérifie `/api/health` (`status`, `postgres`, `schema`), l’accueil et une page ville.

## Migrations

`supabase/migrations/*.sql` (idempotentes, `create table if not exists`) sont appliquées par le job `migrate` de chaque release, avant le nouveau conteneur web ; le web ne migre jamais au démarrage. Une colonne ne se supprime ou ne se renomme qu’au déploiement suivant celui qui cesse de l’utiliser (l’ancien code tourne quelques secondes sur le nouveau schéma). `/api/health` dit si le schéma est là.

## Historique : passage à Postgres 18 (novembre 2026)

Avant le kit, sous le projet `eau-robinet` (`/srv/eau-robinet`, volume `eau-robinet_pgdata18`, conservé avec `eau-robinet_pgdata`).

La base est passée de Postgres 16 à 18 par le workflow manuel **Postgres 18 upgrade** (script `scripts/postgres-18-upgrade.sh`). Ce workflow a été supprimé le 2026-11-18 une fois la bascule faite : il confiait la clé SSH root à une action tierce. Le script et son banc de test restent pour mémoire. Le compose de prod utilise déjà Postgres 18 sur le volume externe `eau-robinet_pgdata18` : tant que la bascule n’est pas faite, un déploiement habituel échoue (« external volume not found ») au lieu de démarrer une base vide, et les conteneurs en cours ne sont pas touchés.

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

Les erreurs API / UI partent vers Sentry si le secret GitHub `SENTRY_DSN` est défini (facultatif : `deploy.optionalSecrets`). Le plan Developer gratuit envoie un mail sur chaque nouvelle issue. Pas de Session Replay : on n’envoie que le message et des tags (scope, event).

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
