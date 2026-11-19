#!/usr/bin/env python3
"""Executed on the VPS exclusively by the repository's GitHub Actions workflow."""
import datetime
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tempfile
import time
import urllib.request

# site_config.py and site.config.json travel with this file in the release bundle (dispatch.py).
sys.path.insert(0, str(Path(__file__).resolve().parent))
import site_config  # noqa: E402

SITE = site_config.load()
BASE = SITE.directory
PROJECT = SITE.project
PGDATA = SITE.database_volume
# None for a site without media: no media volume, no media-init, no media archive.
MEDIA = SITE.media_volume
VOLUMES = [PGDATA, *([MEDIA] if MEDIA else [])]
# Previous database volume (e.g. Postgres 16), kept untouched after a fresh database was created.
LEGACY_PGDATA = SITE.legacy_database_volume
# Local copies only cover a quick rollback: nightly encrypted off-site backups exist (infra-traefik).
KEEP_LOCAL_BACKUPS = 5
KEEP_RELEASES = 5
# Images of this app on the VPS: the current release plus this many previous ones (a release = web tag + '-ops' tag).
KEEP_PREVIOUS_IMAGE_RELEASES = 2
BACKUP_NAME = re.compile(r'\d{8}T\d{6}Z-[0-9a-f]{12}')
RELEASE_NAME = re.compile(r'[0-9a-f]{40}')
IMAGE_TAG = re.compile(r'([0-9a-f]{40})(-ops)?')


def volume_plan(existing, previous):
    """Decide which volumes to create and whether to run data-check.

    `existing` maps every volume present on the host to its labels. A missing production
    volume is refused, except the Postgres 18 one during the planned switch: the legacy
    Postgres 16 volume exists, so the empty database is intentional.
    """
    create = []
    for name in VOLUMES:
        if name in existing:
            if previous is None:
                raise RuntimeError('Volume existant sans configuration persistante : arrêt pour éviter une réinitialisation.')
            if (existing[name] or {}).get(SITE.volume_owner_label) != PROJECT:
                raise RuntimeError('Volume existant sans marqueur de propriété de ce site : arrêt.')
        elif previous and not (name == PGDATA and LEGACY_PGDATA is not None and LEGACY_PGDATA in existing):
            raise RuntimeError('Volume de production manquant : refus de recréer une base vide.')
        else:
            create.append(name)
    return {'create': create, 'check_data': PGDATA in existing}
# Another site on the same VPS, checked before and after the deploy.
PROTECTED_URL = SITE.protected_health_url


HOST_PATTERN = r'(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}'


def valid_host(host):
    return len(host) <= 253 and re.fullmatch(HOST_PATTERN, host) and host not in SITE.protected_hosts


def aliases(value, host):
    """Comma-separated extra hostnames, each redirected permanently to the primary host."""
    names = [name.strip() for name in (value or '').split(',') if name.strip()]
    if len(names) > 5 or len(set(names)) != len(names) or any(not valid_host(name) or name == host for name in names):
        raise ValueError('Alias de domaine invalides.')
    return names


def read_inputs(text):
    """The deploy input sent by dispatch.py: a JSON object of strings, only this site's keys.

    An invalid entry is reported by its position only: a malformed entry may hold a secret, and
    the deploy logs are public.
    """
    try:
        data = json.loads(text)
    except ValueError:
        raise ValueError('Entrée de déploiement illisible.') from None
    if not isinstance(data, dict):
        raise ValueError('Entrée de déploiement invalide : objet JSON attendu.')
    allowed = set(site_config.input_keys(SITE))
    for position, (key, value) in enumerate(data.items(), start=1):
        if key not in allowed or not isinstance(value, str):
            raise ValueError(f'Entrée de déploiement invalide : entrée {position}.')
    return data


def runtime_config(inputs, previous=None):
    # A pasted secret with a line break is refused by name only, before anything uses it.
    for key in site_config.input_keys(SITE):
        if any(character in (inputs.get(key) or '') for character in '\r\n'):
            raise ValueError(f'{key} contient un saut de ligne.')
    required = ['WEB_IMAGE', 'OPS_IMAGE', *SITE.required_secrets, 'TRAEFIK_HOST']
    if any(not inputs.get(key) for key in required):
        raise ValueError('Secrets ou paramètres requis absents.')
    if any(len(inputs[key]) < (24 if key == 'POSTGRES_PASSWORD' else 32) for key in SITE.required_secrets):
        raise ValueError('Secrets de production trop courts.')
    host = inputs['TRAEFIK_HOST']
    if not valid_host(host) or (SITE.www_redirect and not valid_host('www.' + host)):
        raise ValueError('Domaine public invalide ou réservé à un autre site.')
    if not site_config.image_pattern(SITE).fullmatch(inputs['WEB_IMAGE']):
        raise ValueError('Image immuable GHCR attendue (tag SHA).')
    # One-off jobs (migrations, bootstrap, CI scripts) use the ops image built from the same commit.
    if inputs['OPS_IMAGE'] != inputs['WEB_IMAGE'] + '-ops':
        raise ValueError('Image ops attendue : même dépôt et même SHA que WEB_IMAGE, suffixe -ops.')
    values = {key: inputs[key] for key in required}
    stripped = [*(site_config.PAYMENT_INPUTS[1:] if SITE.payments else []), *(site_config.EMAIL_INPUTS[1:] if SITE.email else []), *SITE.optional_secrets]
    for key in stripped:
        values[key] = inputs.get(key, '').strip()
    if SITE.email:
        email_settings(values, inputs)
    if SITE.payments:
        payment_settings(values, inputs)
    values['TRAEFIK_ALIASES'] = ','.join(aliases(inputs.get('TRAEFIK_ALIASES'), host))
    if SITE.www_redirect and 'www.' + host in values['TRAEFIK_ALIASES'].split(','):
        raise ValueError('Alias de domaine invalides : www est déjà redirigé.')
    if (inputs.get('PUBLIC_INDEXING') or 'false') not in ['true', 'false']:
        raise ValueError('PUBLIC_INDEXING doit être true ou false.')
    values['PUBLIC_INDEXING'] = inputs.get('PUBLIC_INDEXING') or 'false'
    # Traefik drops a custom header whose value is empty: the app then sends its own per-route robots rules.
    values['X_ROBOTS_TAG'] = '' if values['PUBLIC_INDEXING'] == 'true' else 'noindex, nofollow'
    values['APP_URL'] = 'https://' + inputs['TRAEFIK_HOST']
    values['DATABASE_URL'] = site_config.database_url(SITE, inputs['POSTGRES_PASSWORD'])
    if previous is not None and any(values[key] != previous.get(key) for key in SITE.required_secrets):
        raise ValueError('Rotation de secret refusée : une procédure CI dédiée est nécessaire.')
    return values


def email_settings(values, inputs):
    values['EMAIL_MODE'] = inputs.get('EMAIL_MODE') or 'simulated'
    if values['EMAIL_MODE'] not in ['simulated', 'smtp']:
        raise ValueError('EMAIL_MODE invalide.')
    # SMTP may be configured while still simulated, so the CI test email can run before activation.
    if values['SMTP_URL'] and not re.fullmatch(r'smtps?://[^\s/]+(?::\d+)?/?(?:\?\S*)?', values['SMTP_URL']):
        raise ValueError('SMTP_URL invalide : smtps://utilisateur:motdepasse@serveur:465 attendu.')
    if values['EMAIL_FROM'] and not re.fullmatch(r'(?:[^<>\n]*<)?[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+>?', values['EMAIL_FROM']):
        raise ValueError('EMAIL_FROM invalide : « Nom <adresse@domaine> » ou adresse seule attendu.')
    if values['EMAIL_REPLY_TO'] and not re.fullmatch(r'[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+', values['EMAIL_REPLY_TO']):
        raise ValueError('EMAIL_REPLY_TO invalide : adresse seule attendue.')
    if values['EMAIL_MODE'] == 'smtp' and not (values['SMTP_URL'] and values['EMAIL_FROM']):
        raise ValueError('EMAIL_MODE=smtp exige SMTP_URL et EMAIL_FROM.')


def payment_settings(values, inputs):
    values['STRIPE_MODE'] = inputs.get('STRIPE_MODE') or 'test'
    mode = values['STRIPE_MODE']
    if mode not in ['test', 'live']:
        raise ValueError('STRIPE_MODE doit être test ou live.')
    key = values[f'STRIPE_{mode.upper()}_SECRET_KEY']
    webhook = values[f'STRIPE_{mode.upper()}_WEBHOOK_SECRET']
    if key or webhook or mode == 'live':
        if not key.startswith((f'sk_{mode}_', f'rk_{mode}_')):
            raise ValueError(f'STRIPE_{mode.upper()}_SECRET_KEY absente ou incompatible avec STRIPE_MODE.')
        if not webhook.startswith('whsec_'):
            raise ValueError(f'STRIPE_{mode.upper()}_WEBHOOK_SECRET absent ou invalide.')


def save_private(path, values):
    path.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
    fd, temporary = tempfile.mkstemp(dir=path.parent)
    try:
        with os.fdopen(fd, 'w') as output:
            json.dump(values, output)
            output.write('\n')
        os.replace(temporary, path)
    finally:
        if os.path.exists(temporary):
            os.unlink(temporary)


def alias_override(values):
    """Compose override adding a redirect router for the aliases; generated only from validated hostnames."""
    names = [name for name in values['TRAEFIK_ALIASES'].split(',') if name]
    rule = ' || '.join(f'Host(`{name}`)' for name in names)
    name = SITE.traefik_name
    router = f'traefik.http.routers.{name}-alias'
    middleware = f'traefik.http.middlewares.{name}-to-primary.redirectregex'
    labels = {
        f'{router}.rule': rule, f'{router}.entrypoints': 'websecure', f'{router}.tls.certresolver': 'le',
        f'{router}.service': name, f'{router}.middlewares': f'{name}-to-primary',
        f'{middleware}.regex': '^https?://[^/]+/(.*)', f'{middleware}.replacement': 'https://' + values['TRAEFIK_HOST'] + '/$${1}',
        f'{middleware}.permanent': 'true',
    }
    # JSON is valid YAML: no templating of hostnames into a hand-written document.
    return json.dumps({'services': {'web': {'labels': labels}}}, indent=2) + '\n'


def www_override(values):
    """Compose override redirecting www.<host> permanently to <host> (deploy.wwwRedirect)."""
    name = SITE.traefik_name
    router = f'traefik.http.routers.{name}-www'
    middleware = f'traefik.http.middlewares.{name}-www-redirect.redirectregex'
    labels = {
        f'{router}.rule': f'Host(`www.{values["TRAEFIK_HOST"]}`)', f'{router}.entrypoints': 'websecure',
        f'{router}.tls.certresolver': 'le', f'{router}.middlewares': f'{name}-www-redirect', f'{router}.service': name,
        f'{middleware}.regex': '^https://www\\.(.+)', f'{middleware}.replacement': 'https://$${1}',
        f'{middleware}.permanent': 'true',
    }
    return json.dumps({'services': {'web': {'labels': labels}}}, indent=2) + '\n'


def run(*args, **kwargs):
    return subprocess.run(args, check=True, **kwargs)


def check_health(url):
    with urllib.request.urlopen(url, timeout=10) as response:
        if response.status != 200:
            raise RuntimeError('Healthcheck HTTP en échec.')


def wait_for_health(url):
    deadline = time.monotonic() + 300
    while time.monotonic() < deadline:
        try:
            check_health(url)
            return
        except (OSError, ValueError):
            time.sleep(5)
    raise RuntimeError('HTTPS ou healthcheck non disponible après 5 minutes.')


def quiet_window_delay(now):
    """Seconds to wait so the container swap starts between second 3 and 15 of a minute.

    The commerce jobs run every minute on each web container (Payload autoRun) and Payload claims
    jobs without a lock: the swap, where both containers run for a few seconds, stays clear of
    the minute mark so a job cannot run twice.
    """
    second = now.second + now.microsecond / 1e6
    return 0 if 3 <= second <= 15 else round((63 - second) % 60)


def rollout_web(compose, docker, sleep=time.sleep, now=lambda: datetime.datetime.now(datetime.timezone.utc), quiet_window=None, timings=None):
    """Swap the web container without downtime.

    A new container starts next to the running one; Traefik only routes to it once healthy. The
    old one is then taken out of Traefik (drain flag read by /api/ready) and stopped: Next.js
    finishes its requests on SIGTERM and the router's retry middleware covers any straggler. If the new container never gets healthy it is removed and the old one
    keeps serving. Changed Traefik labels make the two disagree for a few seconds (404s).
    The quiet window and the timings come from site.config.json (deploy.quietWindow, deploy.timings).
    """
    quiet_window = SITE.quiet_window if quiet_window is None else quiet_window
    timings = timings or SITE.timings
    wait = str(timings.health_timeout_seconds)

    def ids(*args):
        return compose('ps', *args, 'web', capture_output=True, text=True).stdout.split()

    running = ids('-q', '--status', 'running')
    # A stopped container left by an interrupted deploy would come back with the old image.
    for stale in [c for c in ids('-aq') if c not in running]:
        docker('rm', '-f', stale, stdout=subprocess.DEVNULL)
    if not running:
        compose('up', '-d', '--no-deps', '--wait', '--wait-timeout', wait, 'web')
        return
    delay = quiet_window_delay(now()) if quiet_window else 0
    if delay:
        sleep(delay)
    try:
        compose('up', '-d', '--no-deps', '--no-recreate', '--wait', '--wait-timeout', wait, '--scale', f'web={len(running) + 1}', 'web')
    except subprocess.CalledProcessError:
        for new in [c for c in ids('-aq') if c not in running]:
            docker('rm', '-f', new, stdout=subprocess.DEVNULL)
        raise RuntimeError('Nouveau conteneur web jamais sain : supprimé, l’ancien continue de servir.')
    sleep(timings.settle_seconds)  # Traefik picks up the new container
    # Drain: /api/ready answers 503 in the old container, Traefik's health check (every second)
    # takes it out of rotation, then it stops with nothing in flight.
    for container in running:
        try:
            docker('exec', container, 'touch', '/tmp/draining')
        except subprocess.CalledProcessError:
            pass
    sleep(timings.drain_seconds)
    docker('stop', '-t', '30', *running, stdout=subprocess.DEVNULL)
    docker('rm', *running, stdout=subprocess.DEVNULL)


def prune_directory(root, pattern, keep, key, protected):
    """Delete real directories of `root` matching `pattern` beyond the `keep` newest by `key`.

    Symlinks, files and non-matching names are never candidates, and rmtree only runs on a real
    directory. Protected names are skipped without counting for the retention. Logs names only.
    """
    if not root.is_dir():
        return
    candidates = [entry for entry in root.iterdir() if pattern.fullmatch(entry.name) and not entry.is_symlink() and entry.is_dir()]
    for entry in sorted(candidates, key=key, reverse=True)[keep:]:
        if entry.name in protected or entry.is_symlink():
            continue
        try:
            shutil.rmtree(entry)
            print(f'Rétention : {root.name}/{entry.name} supprimé.')
        except OSError as error:
            print(f'Rétention : {root.name}/{entry.name} non supprimé ({type(error).__name__}).')


def prune_old(base, release_name, backup_name):
    """Retention after a successful release: the KEEP_* newest backups and releases remain.

    Never deletes what current.json references, the release being run or the backup just created.
    A pruning problem never fails a release that is already healthy.
    """
    protected_releases = {release_name}
    protected_backups = {backup_name}
    try:
        current = json.loads((base / 'current.json').read_text())
        protected_releases.add(str(current.get('sha')))
        protected_backups.add(Path(str(current.get('backup'))).name)
    except (OSError, ValueError, AttributeError):
        pass
    prune_directory(base / 'backups', BACKUP_NAME, KEEP_LOCAL_BACKUPS, lambda entry: entry.name, protected_backups)
    prune_directory(base / 'releases', RELEASE_NAME, KEEP_RELEASES, lambda entry: entry.stat().st_mtime, protected_releases)


def image_created(text):
    """Sort key of a `docker images` CreatedAt value ('2026-11-18 10:00:00 +0000 UTC')."""
    try:
        return datetime.datetime.strptime(text[:25], '%Y-%m-%d %H:%M:%S %z').timestamp()
    except ValueError:
        return 0.0


def docker_output(*args):
    return run('docker', *args, capture_output=True, text=True).stdout


def prune_images(web_image, docker_output=docker_output, docker=lambda *args, **kwargs: run('docker', *args, **kwargs)):
    """Image retention after a healthy release, for this app's repository only.

    A release is the pair `<sha>` (web) and `<sha>-ops` (one-off jobs, never running continuously).
    Kept: both tags of the current release, of every release with an image used by a container
    (running or not), and of the KEEP_PREVIOUS_IMAGE_RELEASES most recent other releases by
    creation date. Other tags of the repository (not `<sha>[-ops]`) and other repositories are never
    candidates. Removal is by tag, never forced; a failure is logged (tag only) and never raised,
    so a healthy deploy stays healthy. Dangling layers are dropped last.
    """
    try:
        repo, current = web_image.rsplit(':', 1)
        in_use = set(docker_output('ps', '-a', '--format', '{{.Image}}').split())
        releases = {}
        for line in docker_output('images', '--format', '{{.CreatedAt}}|{{.Repository}}|{{.Tag}}').splitlines():
            created, _, rest = line.partition('|')
            name, _, tag = rest.partition('|')
            match = IMAGE_TAG.fullmatch(tag)
            if name != repo or not match:
                continue
            entry = releases.setdefault(match.group(1), {'created': 0.0, 'tags': set()})
            entry['created'] = max(entry['created'], image_created(created))
            entry['tags'].add(tag)
        keep = {current} | {sha for sha, entry in releases.items() if any(f'{repo}:{tag}' in in_use for tag in entry['tags'])}
        others = sorted((sha for sha in releases if sha not in keep), key=lambda sha: releases[sha]['created'], reverse=True)
        keep.update(others[:KEEP_PREVIOUS_IMAGE_RELEASES])
        for sha in sorted(releases):
            if sha in keep:
                continue
            for tag in sorted(releases[sha]['tags']):
                try:
                    docker('rmi', f'{repo}:{tag}', stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                    print(f'Rétention images : tag {tag} supprimé.')
                except (OSError, subprocess.SubprocessError):
                    print(f'Rétention images : tag {tag} non supprimé.')
        docker('image', 'prune', '-f', stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    except Exception as error:
        print(f'Rétention images ignorée ({type(error).__name__}).')


def main():
    site_config.release_name(Path(__file__).resolve(), SITE)
    release = Path(__file__).resolve().parents[1]
    incoming = release / 'deploy-input.json'
    try:
        inputs = read_inputs(incoming.read_text())
    finally:
        incoming.unlink(missing_ok=True)
    previous_path = BASE / 'runtime.json'
    previous = json.loads(previous_path.read_text()) if previous_path.exists() else None
    values = runtime_config(inputs, previous)
    # Fail before altering containers or shared infrastructure.
    run('docker', 'compose', 'version', stdout=subprocess.DEVNULL)
    run('docker', 'network', 'inspect', 'traefik', stdout=subprocess.DEVNULL)
    available_kib = int(next(line.split()[1] for line in Path('/proc/meminfo').read_text().splitlines() if line.startswith('MemAvailable:')))
    disk = os.statvfs(BASE)
    if available_kib < 2 * 1024 * 1024 or disk.f_bavail * disk.f_frsize < 5 * 1024**3:
        raise RuntimeError('Ressources insuffisantes : 2 Go RAM et 5 Go disque disponibles requis.')
    check_health(PROTECTED_URL)
    existing = {}
    for name in [*VOLUMES, *([LEGACY_PGDATA] if LEGACY_PGDATA else [])]:
        result = subprocess.run(['docker', 'volume', 'inspect', name], capture_output=True, text=True)
        if result.returncode == 0:
            existing[name] = json.loads(result.stdout)[0].get('Labels') or {}
    plan = volume_plan(existing, previous)
    env = {**os.environ, **values, **site_config.compose_env(SITE)}
    if site_config.BOOTSTRAP_JOB in SITE.ops_jobs:
        env.update({key: inputs.get(key, '') for key in site_config.BOOTSTRAP_INPUTS})
    compose_args = ['docker', 'compose', '--env-file', '/dev/null', '--project-name', PROJECT, '-f', str(release / 'docker-compose.prod.yml')]
    if values['TRAEFIK_ALIASES']:
        override = release / 'aliases.compose.json'
        override.write_text(alias_override(values))
        compose_args += ['-f', str(override)]
    if SITE.www_redirect:
        override = release / 'www.compose.json'
        override.write_text(www_override(values))
        compose_args += ['-f', str(override)]

    def compose(*args, **kwargs):
        return run(*compose_args, *args, env=env, **kwargs)

    compose('config', '--quiet')
    # Docker login is isolated from the VPS user's normal Docker credentials.
    with tempfile.TemporaryDirectory(prefix='registry-', dir=release) as credentials:
        env['DOCKER_CONFIG'] = credentials
        run('docker', 'login', 'ghcr.io', '-u', inputs['GHCR_USER'], '--password-stdin', env=env, input=inputs['GHCR_TOKEN'], text=True, stdout=subprocess.DEVNULL)
        # Web and ops images: every ops job shares the ops image, so the first one pulls it.
        compose('pull', 'web', *SITE.ops_jobs[:1], 'postgres')
    env.pop('DOCKER_CONFIG')
    for name in plan['create']:
        run('docker', 'volume', 'create', '--label', f'{SITE.volume_owner_label}={PROJECT}', name, stdout=subprocess.DEVNULL)
    # Persist immutable secrets before the first container; retries must use the same secrets.
    if previous is None:
        save_private(previous_path, values)
    # Only an existing database volume must still hold data; a volume created above is empty on purpose.
    if plan['check_data']:
        compose('run', '--rm', '-T', '--no-deps', 'data-check')
    compose('up', '-d', '--wait', '--wait-timeout', '120', 'postgres')
    if MEDIA:
        compose('run', '--rm', '--no-deps', 'media-init')
    # The site keeps serving during the backup. The database is dumped first, then the media: every
    # file the dump references is already on disk when the media archive is taken (files are added,
    # rarely deleted).
    stamp = datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%SZ')
    backup = BASE / 'backups' / f'{stamp}-{release.name[:12]}'
    backup.mkdir(parents=True, exist_ok=False, mode=0o700)
    archives = [('database.dump', ['exec', '-T', 'postgres', 'pg_dump', '-U', SITE.db_user, '-d', SITE.db_name, '-Fc'])]
    if MEDIA:
        archives.append(('media.tar.gz', ['run', '--rm', '-T', '--no-deps', 'media-backup']))
    for filename, command in archives:
        fd = os.open(backup / filename, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
        with os.fdopen(fd, 'wb') as output:
            compose(*command, stdout=output)
    save_private(backup / 'runtime.json', previous or values)
    # No schema change at web startup. Each one-off (deploy.opsJobs, in order) must succeed before promotion.
    for job in SITE.ops_jobs:
        compose('run', '--rm', '-T', '--no-deps', job)
    # The old web container serves until the new one is healthy: it runs a few seconds on the
    # migrated schema, so a column is dropped or renamed only one release after the code stops using it.
    rollout_web(compose, lambda *args, **kwargs: run('docker', *args, **kwargs))
    wait_for_health(values['APP_URL'] + '/api/health')
    check_health(PROTECTED_URL)
    save_private(previous_path, values)
    save_private(BASE / 'current.json', {'sha': release.name, 'image': values['WEB_IMAGE'], 'ops_image': values['OPS_IMAGE'], 'backup': str(backup)})
    prune_old(BASE, release.name, backup.name)
    prune_images(values['WEB_IMAGE'])
    print('Release saine en HTTPS ; site voisin sain. Volumes conservés.')


if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        # Never dump the input JSON or environment (credentials).
        print(f'Déploiement arrêté ({type(error).__name__}). Consulter les étapes précédentes ; aucune suppression de volume ni restauration automatique.', file=sys.stderr)
        sys.exit(1)
