#!/usr/bin/env python3
"""One-off adoption of the running Fontus production by the deploy kit. Fontus only: not a kit file.

Before: compose project `eau-robinet` in /srv/eau-robinet (.env, volume eau-robinet_pgdata18).
After: project `fontus-prod` in /srv/fontus (runtime.json, labelled volume fontus-prod-pgdata18),
deployed by deploy/release.py like every later release. Run by .github/workflows/adopt.yml:

  runner  python3 deploy/adopt.py dispatch
          Ships the release exactly like deploy/dispatch.py (same archive, same remote directory)
          plus this file, starts it on the VPS in the background, then follows its log over short
          SSH calls until it ends: a lost SSH session stops nothing.
  VPS     adopt.py start --mode rehearsal|cutover --stamp <UTC stamp> [--snapshot-done]
          Reads and deletes deploy-input.json, then runs detached; log in
          /srv/fontus/backups/<stamp>-adopt.log (mode 600), never a secret in it.
          adopt.py status --stamp <stamp> --offset <bytes>: new log bytes and the state, as JSON.

Both modes: refuse unless the old project runs, /srv/fontus/runtime.json, the new volume and
the new project do not exist, the incoming secrets equal the old .env and the router labels equal
the running web's; dump the old database in an exported snapshot (rows counted in the same
snapshot) into /srv/fontus/backups/<stamp>-adopt/, create the labelled volume, start the new
postgres, restore, compare the row count of every table.
  rehearsal  then runs the ops jobs on the copy and removes the new project and volume. The old
             site is never touched. The dump and the log stay.
  cutover    then writes runtime.json and runs the first kit release (deploy/release.py: backup,
             migrations, new web beside the old one under the same router names). The old web is
             drained; once the site answers over HTTPS from the new web alone, the old web and the
             old postgres are stopped (not removed). Their volumes, /srv/eau-robinet and the dump stay.
Any failure before the old web stops puts the old web back in rotation and removes only what
the adoption created (new containers and network, new volume, runtime.json, current.json).
"""
import argparse
import datetime
import fcntl
import hmac
import json
import os
from pathlib import Path
import re
import shlex
import signal
import subprocess
import sys
import tempfile
import time
from urllib.parse import unquote, urlsplit

sys.path.insert(0, str(Path(__file__).resolve().parent))
import release  # noqa: E402
import site_config  # noqa: E402

SITE = site_config.load()
BASE = SITE.directory
# Today's production, deployed before the kit (commit 7b69216 and earlier).
OLD_DIR = Path('/srv/eau-robinet')
OLD_PROJECT = 'eau-robinet'
MODES = ('rehearsal', 'cutover')
STAMP = re.compile(r'\d{8}T\d{6}Z')
SHA = re.compile(r'[0-9a-f]{40}')
RESULT = 'ADOPT_RESULT='
LOCK = 'adopt.lock'
SNAPSHOT = re.compile(r'[0-9A-Fa-f]+-[0-9A-Fa-f]+-[0-9]+')
COUNT_LINE = re.compile(r'([^\t]+)\t(\d+)')
# Exact row count of every base table of the user schemas, in one statement (so inside the
# caller's snapshot); the same query as the nightly infra backup (infra-traefik vps_backup_dump.py).
COUNTS_SQL = (
    "select table_schema || '.' || table_name as qualified_name, "
    "(xpath('/row/c/text()', query_to_xml("
    "format('select count(*) as c from %I.%I', table_schema, table_name), false, true, '')))[1]::text::bigint as rows "
    "from information_schema.tables "
    "where table_type = 'BASE TABLE' and table_schema not in ('pg_catalog', 'information_schema') "
    "order by 1;"
)
RELEASE_TIMEOUT_SECONDS = 1500
# Follow-up from the runner: one short SSH call per poll.
POLL_SECONDS = 10
FOLLOW_SECONDS = 45 * 60
MAX_SSH_FAILURES = 30


class Failed(Exception):
    """A refusal or a failed check; its message never holds a secret."""


class Interrupted(Exception):
    """SIGTERM or SIGINT on the detached process: handled like any failure."""


class Host:
    """The VPS as adopt.py uses it (replaced by a double in tests/test_adopt.py)."""

    def run(self, args, check=True, **kwargs):
        return subprocess.run(args, check=check, **kwargs)

    def popen(self, args, **kwargs):
        return subprocess.Popen(args, **kwargs)

    def sleep(self, seconds):
        time.sleep(seconds)

    def check_health(self, url):
        release.check_health(url)


class Compose:
    """docker compose for the new project, with the same files and environment as release.py."""

    def __init__(self, host, release_dir, values):
        self.host = host
        self.env = {**os.environ, **values, **site_config.compose_env(SITE)}
        files = ['-f', str(release_dir / 'docker-compose.prod.yml')]
        if values['TRAEFIK_ALIASES']:
            (release_dir / 'aliases.compose.json').write_text(release.alias_override(values))
            files += ['-f', str(release_dir / 'aliases.compose.json')]
        if SITE.www_redirect:
            (release_dir / 'www.compose.json').write_text(release.www_override(values))
            files += ['-f', str(release_dir / 'www.compose.json')]
        self.args = ['docker', 'compose', '--env-file', '/dev/null', '--project-name', SITE.project, *files]

    def __call__(self, *args, env=None, **kwargs):
        return self.host.run([*self.args, *args], env=env or self.env, **kwargs)


def log(message):
    print(f'[{datetime.datetime.now(datetime.timezone.utc):%H:%M:%S}] {message}', flush=True)


def describe(error):
    """What a failure prints: our own messages, or the command (never a secret: those travel in env/stdin)."""
    if isinstance(error, (Failed, Interrupted, ValueError, RuntimeError)) and not isinstance(error, json.JSONDecodeError):
        return str(error)
    if isinstance(error, (subprocess.CalledProcessError, subprocess.TimeoutExpired)):
        command = error.cmd if isinstance(error.cmd, list) else [str(error.cmd)]
        code = getattr(error, 'returncode', 'délai dépassé')
        return f'commande en échec ({code}) : {shlex.join(str(part) for part in command[:12])}'
    return type(error).__name__


def running(host, project, service):
    """Running containers of a compose service (one-off `compose run` containers excluded)."""
    return host.run(['docker', 'ps', '-q', '--filter', f'label=com.docker.compose.project={project}',
                     '--filter', f'label=com.docker.compose.service={service}',
                     '--filter', 'label=com.docker.compose.oneoff=False', '--filter', 'status=running'],
                    capture_output=True, text=True).stdout.split()


def check_layout(host):
    """Today's production runs, and nothing of the new layout exists yet."""
    if (BASE / 'runtime.json').exists():
        raise Failed(f'{BASE}/runtime.json existe déjà : le site est déjà géré par le kit, adoption refusée.')
    if not (OLD_DIR / '.env').is_file():
        raise Failed(f'{OLD_DIR}/.env absent : ancien site introuvable, adoption refusée.')
    webs, databases = running(host, OLD_PROJECT, 'web'), running(host, OLD_PROJECT, 'postgres')
    if not webs or len(databases) != 1:
        raise Failed(f'L’ancien site ({OLD_PROJECT}) ne tourne pas : {len(webs)} web, {len(databases)} postgres ; adoption refusée.')
    if host.run(['docker', 'volume', 'inspect', SITE.database_volume], check=False,
                stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL).returncode == 0:
        raise Failed(f'Le volume {SITE.database_volume} existe déjà : adoption refusée (ni réutilisé ni supprimé).')
    leftovers = host.run(['docker', 'ps', '-aq', '--filter', f'label=com.docker.compose.project={SITE.project}'],
                         capture_output=True, text=True).stdout.split()
    if leftovers:
        raise Failed(f'{len(leftovers)} conteneur(s) du projet {SITE.project} existent déjà : adoption refusée.')
    log(f'Ancien site en service : {len(webs)} web, 1 postgres ; rien du projet {SITE.project} sur le serveur.')
    return {'web': webs, 'postgres': databases[0]}


def read_env(path):
    """KEY=VALUE lines of the old .env; the last line of a key wins (as the old deploy read it)."""
    values = {}
    for line in path.read_text(encoding='utf-8').splitlines():
        key, separator, value = line.partition('=')
        if separator and not key.startswith('#'):
            values[key.strip()] = value
    return values


def same(first, second):
    return hmac.compare_digest(first.encode(), second.encode())


def check_old_env(inputs):
    """The incoming secrets are today's: compared with the old .env, never printed."""
    old = read_env(OLD_DIR / '.env')
    for key in (*SITE.required_secrets, *SITE.optional_secrets):
        incoming, current = inputs.get(key, ''), old.get(key, '')
        if key in SITE.optional_secrets:
            incoming, current = incoming.strip(), current.strip()
        if not same(incoming, current):
            raise Failed(f'{key} diffère de {OLD_DIR}/.env (valeurs non affichées) : corriger le secret GitHub, adoption refusée.')
    try:
        url = urlsplit(old.get('DATABASE_URL', ''))
        user, password, path = url.username, unquote(url.password or ''), url.path
    except ValueError:
        raise Failed(f'DATABASE_URL illisible dans {OLD_DIR}/.env : adoption refusée.') from None
    if user != SITE.db_user or path != '/' + SITE.db_name or not same(password, inputs['POSTGRES_PASSWORD']):
        raise Failed(f'DATABASE_URL de {OLD_DIR}/.env : utilisateur, base ou mot de passe différent de la configuration du kit ; adoption refusée.')
    if old.get('TRAEFIK_HOST') != inputs['TRAEFIK_HOST']:
        raise Failed(f'TRAEFIK_HOST diffère de {OLD_DIR}/.env : adoption refusée.')
    log(f'Secrets identiques à {OLD_DIR}/.env (comparés sans affichage).')


def traefik_labels(labels):
    return {key: value for key, value in (labels or {}).items() if key.startswith('traefik.')}


def check_labels(host, compose, webs):
    """Both projects serve under the same router names: Traefik merges them only if identical."""
    rendered = json.loads(compose('config', '--format', 'json', capture_output=True, text=True).stdout)
    # `compose config` keeps `$$` escaped; the container label holds a single `$`.
    new = {key: value.replace('$$', '$') for key, value in traefik_labels(rendered['services']['web'].get('labels')).items()}
    for container in webs:
        old = traefik_labels(json.loads(host.run(['docker', 'inspect', '--format', '{{json .Config.Labels}}', container],
                                                 capture_output=True, text=True).stdout))
        differ = sorted(key for key in set(old) | set(new) if old.get(key) != new.get(key))
        if differ:
            raise Failed('Étiquettes Traefik différentes de l’ancien web (pas de fusion des routeurs) : ' + ', '.join(differ))
    log(f'Étiquettes Traefik du nouveau web identiques à l’ancien ({len(new)}).')


def check_serving(host, url, message):
    try:
        host.check_health(url)
    except Exception:
        raise Failed(message) from None


def pull_images(host, compose, inputs, release_dir):
    """Same registry login as release.py (throwaway Docker config): fails before anything is created."""
    with tempfile.TemporaryDirectory(prefix='registry-', dir=release_dir) as credentials:
        env = {**compose.env, 'DOCKER_CONFIG': credentials}
        host.run(['docker', 'login', 'ghcr.io', '-u', inputs['GHCR_USER'], '--password-stdin'], env=env,
                 input=inputs['GHCR_TOKEN'], text=True, stdout=subprocess.DEVNULL)
        compose('pull', 'web', *SITE.ops_jobs[:1], 'postgres', env=env)
    log('Images de la release présentes sur le serveur.')


def parse_counts(text):
    counts = {}
    for line in text.splitlines():
        match = COUNT_LINE.fullmatch(line.strip('\r'))
        if match:
            counts[match.group(1)] = int(match.group(2))
    return counts


def dump_old(host, container, dump_dir):
    """pg_dump of the old database in an exported snapshot; its rows are counted in the same snapshot."""
    dump_dir.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
    dump_dir.mkdir(exist_ok=False, mode=0o700)
    psql = ['docker', 'exec', '-i', container, 'psql', '-X', '-q', '-A', '-t', '-v', 'ON_ERROR_STOP=1',
            '-U', SITE.db_user, '-d', SITE.db_name]
    session = host.popen(psql, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, text=True)
    try:
        session.stdin.write('begin isolation level repeatable read read only;\nselect pg_export_snapshot();\n')
        session.stdin.flush()
        snapshot = ''
        while not snapshot:
            line = session.stdout.readline()
            if line == '':
                raise Failed('psql s’est arrêté avant d’exporter un instantané de l’ancienne base.')
            snapshot = line.strip()
        if not SNAPSHOT.fullmatch(snapshot):
            raise Failed('Identifiant d’instantané inattendu de l’ancienne base.')
        path = dump_dir / 'database.dump'
        with os.fdopen(os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600), 'wb') as output:
            host.run(['docker', 'exec', container, 'pg_dump', '-U', SITE.db_user, '-d', SITE.db_name, '-Fc',
                      '--lock-wait-timeout=60s', f'--snapshot={snapshot}'], stdout=output)
        session.stdin.write("\\pset fieldsep '\\t'\n" + COUNTS_SQL + '\ncommit;\n')
        session.stdin.flush()
        session.stdin.close()
        counts = parse_counts(session.stdout.read())
        if session.wait() != 0:
            raise Failed('Comptage des lignes de l’ancienne base en échec.')
    finally:
        try:
            session.stdin.close()
            session.wait(timeout=10)
        except Exception:
            session.kill()
    log(f'Dump de l’ancienne base : {path} ({path.stat().st_size} octets, {len(counts)} tables comptées dans le même instantané).')
    return counts


def wait_ready(host, compose):
    """The image's first-start server listens on the socket only (and passes the compose health
    check): the database is initialised once it accepts TCP connections."""
    for _ in range(60):
        if compose('exec', '-T', 'postgres', 'pg_isready', '-h', '127.0.0.1', '-U', SITE.db_user, '-d', SITE.db_name,
                   check=False, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL).returncode == 0:
            return
        host.sleep(1)
    raise Failed('La nouvelle base n’accepte pas de connexion TCP après 60 s.')


def restore(compose, dump):
    with open(dump, 'rb') as source:
        compose('exec', '-T', 'postgres', 'pg_restore', '-U', SITE.db_user, '-d', SITE.db_name, '--no-owner',
                '--no-privileges', '--exit-on-error', '--single-transaction', stdin=source)
    log('Dump restauré dans la nouvelle base.')


def count_new(compose):
    return parse_counts(compose('exec', '-T', 'postgres', 'psql', '-X', '-q', '-A', '-t', '-v', 'ON_ERROR_STOP=1',
                                '-F', '\t', '-U', SITE.db_user, '-d', SITE.db_name, '-c', COUNTS_SQL,
                                capture_output=True, text=True).stdout)


def compare(source, copy):
    log('Lignes par table (table, ancienne base, copie) :')
    for name in sorted(set(source) | set(copy)):
        log(f'  {name}  {source.get(name, "absente")}  {copy.get(name, "absente")}')
    if not source:
        raise Failed('Aucune table comptée dans l’ancienne base.')
    differ = sorted(name for name in set(source) | set(copy) if source.get(name) != copy.get(name))
    if differ:
        raise Failed('Nombre de lignes différent pour : ' + ', '.join(differ))
    log(f'Copie vérifiée : {len(source)} tables, mêmes nombres de lignes.')


def run_release(host, release_dir, inputs):
    """The first kit release, exactly as dispatch.py runs it: deploy-input.json next to release.py."""
    incoming = release_dir / 'deploy-input.json'
    incoming.unlink(missing_ok=True)
    with os.fdopen(os.open(incoming, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600), 'w') as output:
        json.dump(inputs, output)
    log('Première release du kit (deploy/release.py) :')
    try:
        host.run(['python3', str(release_dir / 'deploy' / 'release.py')], timeout=RELEASE_TIMEOUT_SECONDS)
    except subprocess.SubprocessError:
        raise Failed('La release du kit a échoué (lignes ci-dessus).') from None
    finally:
        incoming.unlink(missing_ok=True)


def serving_alone(host, url, needed=3, attempts=10):
    """The public URL answers several times in a row while the old web is out of rotation."""
    streak = 0
    for _ in range(attempts):
        try:
            host.check_health(url)
            streak += 1
            if streak == needed:
                return True
        except Exception:
            streak = 0
        host.sleep(2)
    return False


def switch(host, url, state):
    """Old web drained; stopped only once the site answers from the new web alone. Then old postgres."""
    webs = running(host, OLD_PROJECT, 'web')
    for container in webs:
        state['drained'].append(container)
        host.run(['docker', 'exec', container, 'touch', '/tmp/draining'], check=False,
                 stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    host.sleep(SITE.timings.drain_seconds)
    if not serving_alone(host, url):
        raise Failed('Le site ne répond pas en HTTPS depuis le seul nouveau web : retour à l’ancien.')
    state['switched'] = True
    log('Le site répond depuis le nouveau web seul : arrêt de l’ancien web (conservé, non supprimé).')
    host.run(['docker', 'stop', '-t', '30', *webs], stdout=subprocess.DEVNULL)
    databases = running(host, OLD_PROJECT, 'postgres')
    host.run(['docker', 'stop', '-t', '60', *databases], stdout=subprocess.DEVNULL)
    log('Ancien postgres arrêté (conservé, non supprimé).')


def undo(host, compose, state):
    """Old web back in rotation, then remove only what this adoption created. True when complete."""
    complete = True
    for container in state['drained']:
        host.run(['docker', 'exec', container, 'rm', '/tmp/draining'], check=False,
                 stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        log('Ancien web remis en service.')
    state['drained'] = []
    if state['project']:
        new = compose('ps', '-q', 'web', check=False, capture_output=True, text=True).stdout.split()
        for container in new:
            host.run(['docker', 'exec', container, 'touch', '/tmp/draining'], check=False,
                     stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        if new:
            host.sleep(SITE.timings.drain_seconds)
        if compose('down', '--remove-orphans', '--timeout', '30', check=False).returncode == 0:
            state['project'] = False
            log(f'Projet {SITE.project} supprimé (conteneurs et réseau).')
        else:
            complete = False
            log(f'Projet {SITE.project} NON supprimé : à nettoyer à la main.')
    if state['volume'] and not state['project']:
        if host.run(['docker', 'volume', 'rm', SITE.database_volume], check=False,
                    stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL).returncode == 0:
            state['volume'] = False
            log(f'Volume {SITE.database_volume} supprimé.')
        else:
            complete = False
            log(f'Volume {SITE.database_volume} NON supprimé : à nettoyer à la main.')
    elif state['volume']:
        complete = False
    if state['runtime']:
        for name in ('runtime.json', 'current.json'):
            (BASE / name).unlink(missing_ok=True)
        state['runtime'] = False
        log(f'{BASE}/runtime.json supprimé.')
    return complete


def adopt(mode, inputs, release_dir, stamp, host=None):
    """The whole adoption on the VPS; prints the log, ends with ADOPT_RESULT=<ok|failed|failed-after-switch>."""
    host = host or Host()
    state = {'project': False, 'volume': False, 'runtime': False, 'drained': [], 'switched': False}
    result = 'failed'
    compose = None
    log(f'Adoption, mode {mode} : {OLD_PROJECT} ({OLD_DIR}) vers {SITE.project} ({BASE}).')
    try:
        values = release.runtime_config(inputs)
        url = values['APP_URL'] + '/api/health'
        old = check_layout(host)
        check_old_env(inputs)
        compose = Compose(host, release_dir, values)
        check_labels(host, compose, old['web'])
        check_serving(host, url, f'{url} ne répond pas : adoption refusée.')
        pull_images(host, compose, inputs, release_dir)
        dump_dir = BASE / 'backups' / f'{stamp}-adopt'
        source = dump_old(host, old['postgres'], dump_dir)
        host.run(['docker', 'volume', 'create', '--label', f'{SITE.volume_owner_label}={SITE.project}', SITE.database_volume],
                 stdout=subprocess.DEVNULL)
        state['volume'] = True
        log(f'Volume {SITE.database_volume} créé ({SITE.volume_owner_label}={SITE.project}).')
        state['project'] = True
        compose('up', '-d', '--wait', '--wait-timeout', '120', 'postgres')
        wait_ready(host, compose)
        restore(compose, dump_dir / 'database.dump')
        compare(source, count_new(compose))
        if mode == 'rehearsal':
            for job in SITE.ops_jobs:
                compose('run', '--rm', '-T', '--no-deps', job)
                log(f'Tâche {job} passée sur la copie.')
            if not undo(host, compose, state):
                raise Failed('Nettoyage de la répétition incomplet.')
            check_serving(host, url, f'{url} ne répond plus après la répétition.')
            log(f'Répétition réussie : ancien site intact ; conservés : {dump_dir} et ce journal.')
        else:
            release.save_private(BASE / 'runtime.json', values)
            state['runtime'] = True
            run_release(host, release_dir, inputs)
            switch(host, url, state)
            check_serving(host, url, f'{url} ne répond plus après l’arrêt de l’ancien site.')
            check_serving(host, SITE.protected_health_url, 'Le site voisin ne répond plus.')
            log(f'Bascule réussie : {SITE.project} sert le site. Conservés : volumes {OLD_PROJECT}_*, {OLD_DIR}, {dump_dir}.')
        result = 'ok'
    except Exception as error:
        log(f'Échec : {describe(error)}')
        if state['switched']:
            result = 'failed-after-switch'
            log('L’ancien web est déjà arrêté : pas de retour automatique ; le nouveau projet et son volume sont conservés.')
        elif compose is not None:
            undo(host, compose, state)
            if running(host, OLD_PROJECT, 'web'):
                log('L’ancien site continue de servir.')
    finally:
        print(f'{RESULT}{result}', flush=True)
    return 0 if result == 'ok' else 1


def background(mode, inputs, release_dir, stamp, log_fd, lock_fd):
    """Fork; the child leaves the SSH session, writes to the log and holds the lock until it exits."""
    if os.fork():
        return
    os.setsid()
    devnull = os.open(os.devnull, os.O_RDONLY)
    os.dup2(devnull, 0)
    os.dup2(log_fd, 1)
    os.dup2(log_fd, 2)
    signal.signal(signal.SIGHUP, signal.SIG_IGN)
    signal.signal(signal.SIGPIPE, signal.SIG_IGN)

    def interrupt(signum, frame):
        # Once: a second signal must not cut the clean-up short.
        signal.signal(signal.SIGTERM, signal.SIG_IGN)
        signal.signal(signal.SIGINT, signal.SIG_IGN)
        raise Interrupted(f'interruption (signal {signum})')
    signal.signal(signal.SIGTERM, interrupt)
    signal.signal(signal.SIGINT, interrupt)
    code = 1
    try:
        code = adopt(mode, inputs, release_dir, stamp)
    finally:
        sys.stdout.flush()
        os._exit(code)


def stamp_argument(value):
    if not STAMP.fullmatch(value):
        raise argparse.ArgumentTypeError('horodatage AAAAMMJJTHHMMSSZ attendu')
    return value


def log_path(stamp):
    return BASE / 'backups' / f'{stamp}-adopt.log'


def start(argv, background=background):
    parser = argparse.ArgumentParser(prog='adopt.py start')
    parser.add_argument('--mode', choices=MODES, required=True)
    parser.add_argument('--stamp', type=stamp_argument, required=True)
    parser.add_argument('--snapshot-done', action='store_true')
    args = parser.parse_args(argv)
    script = Path(__file__).resolve()
    site_config.release_name(script, SITE)
    release_dir = script.parents[1]
    incoming = release_dir / 'deploy-input.json'
    try:
        inputs = release.read_inputs(incoming.read_text())
    finally:
        incoming.unlink(missing_ok=True)
    if args.mode == 'cutover' and not args.snapshot_done:
        parser.error('cutover : prendre l’instantané Hostinger avant, puis passer --snapshot-done')
    (BASE / 'backups').mkdir(parents=True, exist_ok=True, mode=0o700)
    lock_fd = os.open(BASE / LOCK, os.O_RDWR | os.O_CREAT, 0o600)
    try:
        fcntl.flock(lock_fd, fcntl.LOCK_EX | fcntl.LOCK_NB)
    except BlockingIOError:
        os.close(lock_fd)
        raise RuntimeError('Une adoption est déjà en cours sur ce serveur.') from None
    path = log_path(args.stamp)
    log_fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_APPEND, 0o600)
    sys.stdout.flush()
    sys.stderr.flush()
    background(args.mode, inputs, release_dir, args.stamp, log_fd, lock_fd)
    print(f'Adoption ({args.mode}) lancée en arrière-plan ; journal : {path}')
    return 0


def lock_held():
    try:
        fd = os.open(BASE / LOCK, os.O_RDONLY)
    except FileNotFoundError:
        return False
    try:
        fcntl.flock(fd, fcntl.LOCK_EX | fcntl.LOCK_NB)
        fcntl.flock(fd, fcntl.LOCK_UN)
        return False
    except BlockingIOError:
        return True
    finally:
        os.close(fd)


def status(stamp, offset):
    """New log bytes since `offset` and the state: running, ok, failed, failed-after-switch or gone."""
    held = lock_held()  # before reading: a process that ends in between has written its result
    path = log_path(stamp)
    data = path.read_bytes() if path.exists() else b''
    results = [line[len(RESULT):] for line in data.decode('utf-8', 'replace').splitlines() if line.startswith(RESULT)]
    state = results[-1] if results else ('running' if held else 'gone')
    return {'text': data[offset:].decode('utf-8', 'replace'), 'size': len(data), 'state': state}


def follow(execute, script, stamp, sleep):
    """Print the remote log as it grows; one short SSH call per poll, so a dropped session stops nothing."""
    offset, failures, waited, state = 0, 0, 0, 'running'
    while True:
        try:
            reply = execute(f'python3 {shlex.quote(script)} status --stamp {stamp} --offset {offset}',
                            capture_output=True, timeout=60)
            report = json.loads(reply.stdout)
            text, size, state = report['text'], int(report['size']), report['state']
            if not isinstance(text, str) or not isinstance(state, str):
                raise ValueError('réponse invalide')
        except (subprocess.SubprocessError, OSError, ValueError, KeyError, TypeError):
            failures += 1
            if failures > MAX_SSH_FAILURES:
                raise RuntimeError('Serveur injoignable trop longtemps : lire le journal sur le VPS.') from None
            print('Serveur injoignable ou réponse illisible ; nouvel essai (l’adoption continue sur le serveur).', flush=True)
            sleep(POLL_SECONDS)
            continue
        failures = 0
        sys.stdout.write(text)
        sys.stdout.flush()
        offset = size
        if state != 'running':
            break
        if waited >= FOLLOW_SECONDS:
            raise RuntimeError('Adoption toujours en cours après le délai : lire le journal sur le VPS.')
        sleep(POLL_SECONDS)
        waited += POLL_SECONDS
    if state == 'ok':
        print('Adoption terminée.')
        return 0
    print(f'::error::Adoption en échec ({state}) : voir le journal ci-dessus.')
    return 1


def dispatch_main(connection=None, sleep=time.sleep, now=lambda: datetime.datetime.now(datetime.timezone.utc)):
    """Runner side: ships the release like deploy/dispatch.py, starts the adoption, follows it."""
    import dispatch
    if connection is None:
        from ssh_connection import connection
    env = os.environ
    if env.get('GITHUB_REF') != 'refs/heads/main' or env.get('GITHUB_ACTIONS') != 'true':
        raise RuntimeError('Adoption autorisée uniquement depuis la CI de main.')
    sha = env.get('GITHUB_SHA', '')
    if not SHA.fullmatch(sha):
        raise ValueError('SHA invalide.')
    mode = env.get('ADOPT_MODE', '')
    if mode not in MODES:
        raise ValueError('ADOPT_MODE doit être rehearsal ou cutover.')
    if mode == 'cutover' and env.get('SNAPSHOT_DONE') != 'true':
        raise RuntimeError('Bascule refusée : instantané Hostinger non confirmé (snapshot_done).')
    stamp = now().strftime('%Y%m%dT%H%M%SZ')
    root = Path(__file__).resolve().parents[1]
    inputs = {key: env.get(key, '') for key in site_config.input_keys(SITE)}
    inputs['TRAEFIK_HOST'] = site_config.public_host(env, SITE)
    bundle = dispatch.archive(root, json.dumps(inputs).encode())
    directory = f'{SITE.directory}/releases/{sha}'
    script = f'{directory}/deploy/adopt.py'
    flag = ' --snapshot-done' if mode == 'cutover' else ''
    with connection() as execute:
        execute(f'umask 077; mkdir -p {shlex.quote(directory + "/deploy")} && cat > {shlex.quote(script)}',
                input=(root / 'deploy' / 'adopt.py').read_bytes(), timeout=60)
        # dispatch.py's command, with adopt.py started instead of release.py.
        execute(f"trap '' PIPE HUP; umask 077; mkdir -p {shlex.quote(directory)} && "
                f"trap {shlex.quote('rm -f ' + directory + '/deploy-input.json')} EXIT; "
                f"tar -xzf - -C {shlex.quote(directory)} && python3 {shlex.quote(script)} start --mode {mode} --stamp {stamp}{flag}",
                input=bundle, timeout=120)
        return follow(execute, script, stamp, sleep)


def main(argv):
    if argv[:1] == ['dispatch']:
        return dispatch_main()
    if argv[:1] == ['start']:
        return start(argv[1:])
    if argv[:1] == ['status']:
        parser = argparse.ArgumentParser(prog='adopt.py status')
        parser.add_argument('--stamp', type=stamp_argument, required=True)
        parser.add_argument('--offset', type=int, default=0)
        args = parser.parse_args(argv[1:])
        print(json.dumps(status(args.stamp, max(args.offset, 0))))
        return 0
    sys.exit('Usage : adopt.py dispatch | start --mode rehearsal|cutover --stamp S [--snapshot-done] | status --stamp S --offset N')


if __name__ == '__main__':
    try:
        sys.exit(main(sys.argv[1:]))
    except (RuntimeError, ValueError) as error:
        print(f'Adoption refusée : {error}', file=sys.stderr)
        sys.exit(1)
