"""deploy/adopt.py: the one-off move of the running production (project eau-robinet) to the kit's
project fontus-prod, with a stubbed Docker (no container is started by these tests).

What must hold: every refusal happens before anything is created; the old site keeps serving
until the new web answers alone over HTTPS; a failure before the old web stops removes exactly
what the adoption created; the rehearsal always leaves no new project and no new volume; the
dump and the log are kept; no secret is ever written to the log.
"""
import contextlib
import dataclasses
import datetime
import importlib.util
import io
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import tarfile
import tempfile
import unittest
from unittest import mock

ROOT = Path(__file__).resolve().parents[1]
DEPLOY = ROOT / 'deploy'
sys.path.insert(0, str(DEPLOY))


def module(name):
    spec = importlib.util.spec_from_file_location(name, DEPLOY / f'{name}.py')
    result = importlib.util.module_from_spec(spec)
    sys.modules[name] = result
    spec.loader.exec_module(result)
    return result


site_config = module('site_config')
release = module('release')
dispatch = module('dispatch')
adopt = module('adopt')
SITE = site_config.load()

SHA = 'b' * 40
IMAGE = f'{SITE.image_repository}:{SHA}'
PASSWORD = 'Pw-' + 'q' * 29
DSN = 'https://dsnkey123@sentry.example.org/42'
TOKEN = 'ghs_registrytoken0123456789'
INPUTS = {
    'WEB_IMAGE': IMAGE, 'OPS_IMAGE': IMAGE + '-ops', 'TRAEFIK_HOST': SITE.default_host, 'TRAEFIK_ALIASES': '',
    'PUBLIC_INDEXING': 'true', 'POSTGRES_PASSWORD': PASSWORD, 'SENTRY_DSN': DSN, 'GHCR_USER': 'ci', 'GHCR_TOKEN': TOKEN,
}
SECRETS = (PASSWORD, DSN, TOKEN, 'q' * 29)
OLD_ENV = (
    f'POSTGRES_PASSWORD={PASSWORD}\nSENTRY_DSN={DSN}\nTRAEFIK_HOST={SITE.default_host}\n'
    f'DATABASE_URL=postgresql://postgres:{PASSWORD}@postgres:5432/fontus\nDATABASE_POOL_MAX=5\n'
    'DATABASE_SSL=0\nNODE_ENV=production\nWEB_IMAGE=ghcr.io/nayanchauveau/fontus:' + 'c' * 40 + '\n'
)
# Labels of the running web container (compose file of commit 7b69216, TRAEFIK_HOST=fontus.fr).
OLD_LABELS = {
    'traefik.enable': 'true', 'traefik.docker.network': 'traefik',
    'traefik.http.routers.fontus.rule': 'Host(`fontus.fr`)', 'traefik.http.routers.fontus.entrypoints': 'websecure',
    'traefik.http.routers.fontus.tls.certresolver': 'le', 'traefik.http.routers.fontus.middlewares': 'fontus-retry',
    'traefik.http.middlewares.fontus-retry.retry.attempts': '3',
    'traefik.http.middlewares.fontus-retry.retry.initialinterval': '100ms',
    'traefik.http.routers.fontus-www.rule': 'Host(`www.fontus.fr`)', 'traefik.http.routers.fontus-www.entrypoints': 'websecure',
    'traefik.http.routers.fontus-www.tls.certresolver': 'le',
    'traefik.http.routers.fontus-www.middlewares': 'fontus-www-redirect', 'traefik.http.routers.fontus-www.service': 'fontus',
    'traefik.http.middlewares.fontus-www-redirect.redirectregex.regex': '^https://www\\.(.+)',
    'traefik.http.middlewares.fontus-www-redirect.redirectregex.replacement': 'https://${1}',
    'traefik.http.middlewares.fontus-www-redirect.redirectregex.permanent': 'true',
    'traefik.http.services.fontus.loadbalancer.server.port': '3100',
    'traefik.http.services.fontus.loadbalancer.healthcheck.path': '/api/ready',
    'traefik.http.services.fontus.loadbalancer.healthcheck.interval': '1s',
    'traefik.http.services.fontus.loadbalancer.healthcheck.timeout': '1s',
    'com.docker.compose.project': 'eau-robinet', 'com.docker.compose.service': 'web',
}
COUNTS = {'public.udis': 1200, 'public.samples': 54000, 'public.parameters': 310, 'public.sync_jobs': 0}
SNAPSHOT = '00000003-0000001B-1'
APP_HEALTH = f'https://{SITE.default_host}/api/health'


def counts_text(counts):
    return ''.join(f'{name}\t{rows}\n' for name, rows in sorted(counts.items()))


class KeptInput(io.StringIO):
    """What the session received, still readable after adopt.py closed it."""

    def close(self):
        pass


class FakeSession:
    """`docker exec -i <old postgres> psql`: exports a snapshot, then counts rows inside it."""

    def __init__(self, host):
        self.host = host
        self.stdin = KeptInput()
        self._lines = io.StringIO(SNAPSHOT + '\n')
        self.stdout = self

    def readline(self):
        return self._lines.readline()

    def read(self):
        self.host.snapshot_sql = self.stdin.getvalue()
        return counts_text(self.host.old_counts)

    def wait(self, timeout=None):
        return 0

    def kill(self):
        pass


class FakeHost:
    """Docker as adopt.py sees it: the old project running, nothing of fontus-prod yet."""

    def __init__(self, base, new_labels=None, new_counts=None, fail=(), unhealthy=()):
        self.base = base
        self.calls = []
        self.containers = {
            'old-web-1': {'project': 'eau-robinet', 'service': 'web', 'running': True, 'labels': OLD_LABELS},
            'old-postgres-1': {'project': 'eau-robinet', 'service': 'postgres', 'running': True, 'labels': {}},
        }
        self.volumes = {'eau-robinet_pgdata18': {}, 'eau-robinet_pgdata': {}}
        self.old_counts = dict(COUNTS)
        self.new_counts = dict(COUNTS if new_counts is None else new_counts)
        self.new_labels = OLD_LABELS if new_labels is None else new_labels
        self.fail = set(fail)
        self.unhealthy = set(unhealthy)
        self.drained = set()
        self.release_saw = None
        self.snapshot_sql = ''
        self.sleeps = []
        self.health_calls = []
        self.counter = 0

    # adopt.Host interface ------------------------------------------------------------------
    def sleep(self, seconds):
        self.sleeps.append(seconds)

    def check_health(self, url):
        self.health_calls.append(url)
        if url in self.unhealthy:
            raise OSError('unreachable')

    def popen(self, args, **kwargs):
        self.calls.append(['popen', *args])
        return FakeSession(self)

    def run(self, args, check=True, **kwargs):
        args = [str(arg) for arg in args]
        self.calls.append(args)
        code, out = self.answer(args, kwargs)
        if isinstance(out, str) and not kwargs.get('text') and not kwargs.get('encoding'):
            out = out.encode()
        if check and code:
            raise subprocess.CalledProcessError(code, args)
        return subprocess.CompletedProcess(args, code, out, b'' if isinstance(out, bytes) else '')

    # Docker double ---------------------------------------------------------------------------
    def new_id(self, service):
        self.counter += 1
        return f'new-{service}-{self.counter}'

    def ids(self, project, service=None, running_only=True):
        return [name for name, c in self.containers.items()
                if c['project'] == project and (service is None or c['service'] == service) and (c['running'] or not running_only)]

    def answer(self, args, kwargs):
        if 'step:' + self.step(args) in self.fail:
            return 1, ''
        if args[:2] == ['docker', 'compose']:
            return self.compose(args, kwargs)
        if args[0] == 'python3' and args[1].endswith('/deploy/release.py'):
            return self.release(args)
        command = args[1:]
        if command[:1] == ['ps']:
            filters = dict(command[i + 1].split('=', 1) if command[i + 1].startswith('status') else
                           command[i + 1].removeprefix('label=').split('=', 1)
                           for i, arg in enumerate(command) if arg == '--filter')
            ids = self.ids(filters['com.docker.compose.project'], filters.get('com.docker.compose.service'),
                           filters.get('status') == 'running')
            return 0, '\n'.join(ids) + ('\n' if ids else '')
        if command[:1] == ['inspect']:
            return 0, json.dumps(self.containers[command[-1]]['labels']) + '\n'
        if command[:2] == ['volume', 'inspect']:
            return (0, '[{}]') if command[-1] in self.volumes else (1, '')
        if command[:2] == ['volume', 'create']:
            self.volumes[command[-1]] = dict([command[command.index('--label') + 1].split('=', 1)])
            return 0, ''
        if command[:2] == ['volume', 'rm']:
            self.volumes.pop(command[-1])
            return 0, ''
        if command[:1] == ['login']:
            return 0, ''
        if command[:1] == ['exec'] and 'pg_dump' in command:
            kwargs['stdout'].write(b'PGDMP-old')
            return 0, ''
        if command[:1] == ['exec'] and command[-2:] == ['touch', '/tmp/draining']:
            self.drained.add(command[1])
            return 0, ''
        if command[:1] == ['exec'] and command[-2:] == ['rm', '/tmp/draining']:
            self.drained.discard(command[1])
            return 0, ''
        if command[:1] == ['stop']:
            for name in command[3:]:
                self.containers[name]['running'] = False
            return 0, ''
        raise AssertionError(f'unexpected docker command: {args}')

    @staticmethod
    def step(args):
        """A short name of the command, used to make one step fail."""
        if args[:2] == ['docker', 'compose']:
            verbs = [a for a in args if a in ('config', 'pull', 'up', 'exec', 'run', 'down', 'ps')]
            verb = verbs[0]
            if verb == 'exec':
                return 'restore' if 'pg_restore' in args else 'ready' if 'pg_isready' in args else 'count'
            return verb
        if args[0] == 'python3':
            return 'release'
        if 'pg_dump' in args:
            return 'dump'
        if args[1] == 'stop':
            return 'stop-postgres' if 'old-postgres-1' in args else 'stop-web'
        return args[1] + ('-' + args[2] if args[1] == 'volume' else '')

    def compose(self, args, kwargs):
        assert args[2:7] == ['--env-file', '/dev/null', '--project-name', 'fontus-prod', '-f'], args
        env = kwargs['env']
        assert env['POSTGRES_PASSWORD'] == PASSWORD and env['SITE_VOLUME_DATABASE'] == SITE.database_volume
        verb = self.step(args)
        if verb == 'config':
            labels = {k: v.replace('$', '$$') for k, v in self.new_labels.items() if k.startswith('traefik.')}
            return 0, json.dumps({'services': {'web': {'labels': labels}, 'postgres': {}}})
        if verb == 'up':
            assert SITE.database_volume in self.volumes, 'postgres started without its volume'
            self.containers[self.new_id('postgres')] = {'project': 'fontus-prod', 'service': 'postgres', 'running': True, 'labels': {}}
            return 0, ''
        if verb == 'ready':
            # The image's init server listens on the socket only: TCP means the database is initialised.
            assert args[args.index('pg_isready') + 1:args.index('pg_isready') + 3] == ['-h', '127.0.0.1'], args
            return 0, ''
        if verb == 'restore':
            assert kwargs['stdin'].read() == b'PGDMP-old'
            return 0, ''
        if verb == 'count':
            return 0, counts_text(self.new_counts)
        if verb == 'ps':
            return 0, '\n'.join(self.ids('fontus-prod', 'web')) + '\n'
        if verb == 'down':
            for name in self.ids('fontus-prod', running_only=False):
                del self.containers[name]
            return 0, ''
        return 0, ''

    def release(self, args):
        release_dir = Path(args[1]).parents[1]
        incoming = release_dir / 'deploy-input.json'
        self.release_saw = {
            'runtime': json.loads((self.base / 'runtime.json').read_text()),
            'input': json.loads(incoming.read_text()), 'input_mode': incoming.stat().st_mode & 0o777,
            'volume_label': self.volumes.get(SITE.database_volume),
            'old_web_running': self.containers['old-web-1']['running'],
        }
        incoming.unlink()
        self.containers[self.new_id('web')] = {'project': 'fontus-prod', 'service': 'web', 'running': True, 'labels': self.new_labels}
        (self.base / 'current.json').write_text('{}')
        return 0, ''


class AdoptTestCase(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        root = Path(temporary.name).resolve()
        self.base = root / 'srv' / 'fontus'
        self.old_dir = root / 'srv' / 'eau-robinet'
        self.old_dir.mkdir(parents=True)
        (self.old_dir / '.env').write_text(OLD_ENV)
        self.release_dir = self.base / 'releases' / SHA
        (self.release_dir / 'deploy').mkdir(parents=True)
        (self.release_dir / 'docker-compose.prod.yml').write_text('services: {}\n')
        self.stamp = '20261120T081500Z'
        for patch in (mock.patch.object(adopt, 'BASE', self.base), mock.patch.object(adopt, 'OLD_DIR', self.old_dir)):
            patch.start()
            self.addCleanup(patch.stop)

    def run_adopt(self, mode, host=None, inputs=INPUTS):
        host = host or FakeHost(self.base)
        output = io.StringIO()
        with contextlib.redirect_stdout(output), contextlib.redirect_stderr(output):
            code = adopt.adopt(mode, dict(inputs), self.release_dir, self.stamp, host)
        log = output.getvalue()
        for secret in SECRETS:
            self.assertNotIn(secret, log)
        return code, log, host

    def created_nothing(self, host):
        self.assertNotIn(SITE.database_volume, host.volumes)
        self.assertEqual(host.ids('fontus-prod', running_only=False), [])
        self.assertFalse((self.base / 'runtime.json').exists())
        self.assertFalse((self.base / 'current.json').exists())

    def old_untouched(self, host):
        self.assertTrue(host.containers['old-web-1']['running'])
        self.assertTrue(host.containers['old-postgres-1']['running'])
        self.assertNotIn('old-web-1', host.drained)
        self.assertIn('eau-robinet_pgdata18', host.volumes)
        self.assertIn('eau-robinet_pgdata', host.volumes)
        self.assertEqual(self.old_dir.joinpath('.env').read_text(), OLD_ENV)

    def writes(self, host):
        return [call for call in host.calls if FakeHost.step(call) in
                ('volume-create', 'up', 'restore', 'run', 'release', 'stop-web', 'stop-postgres')]


class RefusalTest(AdoptTestCase):
    def assert_refused(self, mode, host, reason, untouched=True):
        code, log, host = self.run_adopt(mode, host)
        self.assertNotEqual(code, 0)
        self.assertIn(reason, log)
        self.assertEqual(self.writes(host), [])
        self.assertFalse(any('pg_dump' in call for call in host.calls))
        self.assertNotIn(SITE.database_volume, host.volumes)
        self.assertEqual(host.ids('fontus-prod', running_only=False), [])
        if untouched:
            self.old_untouched(host)
        self.assertTrue(log.rstrip().endswith('ADOPT_RESULT=failed'))
        return log

    def test_refuses_when_runtime_json_already_exists(self):
        self.base.mkdir(parents=True, exist_ok=True)
        (self.base / 'runtime.json').write_text('{}')
        for mode in adopt.MODES:
            self.assert_refused(mode, FakeHost(self.base), 'runtime.json')
            self.assertTrue((self.base / 'runtime.json').exists())

    def test_refuses_when_the_old_site_does_not_run(self):
        host = FakeHost(self.base)
        host.containers['old-web-1']['running'] = False
        self.assert_refused('cutover', host, 'ancien site', untouched=False)
        host = FakeHost(self.base)
        host.containers['old-postgres-1']['running'] = False
        code, log, _ = self.run_adopt('cutover', host)
        self.assertNotEqual(code, 0)
        self.assertIn('ancien site', log)

    def test_refuses_without_the_old_env_file(self):
        (self.old_dir / '.env').unlink()
        code, log, host = self.run_adopt('rehearsal')
        self.assertNotEqual(code, 0)
        self.assertIn('.env', log)
        self.assertEqual(self.writes(host), [])

    def test_refuses_a_secret_that_differs_from_the_old_env_without_printing_it(self):
        for key, value in (('POSTGRES_PASSWORD', 'Other-' + 'z' * 30), ('SENTRY_DSN', 'https://other@sentry.example.org/1')):
            with self.subTest(key=key):
                code, log, host = self.run_adopt('cutover', inputs={**INPUTS, key: value})
                self.assertNotEqual(code, 0)
                self.assertIn(key, log)
                self.assertNotIn(value, log)
                self.assertEqual(self.writes(host), [])
                self.created_nothing(host)

    def test_refuses_an_old_database_url_for_another_database(self):
        (self.old_dir / '.env').write_text(OLD_ENV.replace('5432/fontus', '5432/other'))
        code, log, host = self.run_adopt('rehearsal')
        self.assertNotEqual(code, 0)
        self.assertIn('DATABASE_URL', log)
        self.assertEqual(self.writes(host), [])

    def test_refuses_a_public_host_other_than_the_old_one(self):
        (self.old_dir / '.env').write_text(OLD_ENV.replace(f'TRAEFIK_HOST={SITE.default_host}', 'TRAEFIK_HOST=old.example.org'))
        code, log, host = self.run_adopt('rehearsal')
        self.assertNotEqual(code, 0)
        self.assertIn('TRAEFIK_HOST', log)
        self.assertEqual(self.writes(host), [])

    def test_refuses_when_the_new_volume_already_exists_and_never_removes_it(self):
        host = FakeHost(self.base)
        host.volumes[SITE.database_volume] = {}
        code, log, host = self.run_adopt('rehearsal', host)
        self.assertNotEqual(code, 0)
        self.assertIn(SITE.database_volume, log)
        self.assertIn(SITE.database_volume, host.volumes)
        self.assertEqual(self.writes(host), [])
        self.assertFalse(any(FakeHost.step(call) in ('volume-rm', 'down') for call in host.calls))

    def test_refuses_when_containers_of_the_new_project_exist(self):
        host = FakeHost(self.base)
        host.containers['left-over'] = {'project': 'fontus-prod', 'service': 'web', 'running': False, 'labels': {}}
        code, log, host = self.run_adopt('rehearsal', host)
        self.assertNotEqual(code, 0)
        self.assertIn('fontus-prod', log)
        self.assertIn('left-over', host.containers)
        self.assertEqual(self.writes(host), [])

    def test_refuses_when_the_router_labels_differ_from_the_running_container(self):
        labels = {**OLD_LABELS, 'traefik.http.services.fontus.loadbalancer.server.port': '3000'}
        code, log, host = self.run_adopt('cutover', FakeHost(self.base, new_labels=labels))
        self.assertNotEqual(code, 0)
        self.assertIn('traefik.http.services.fontus.loadbalancer.server.port', log)
        self.assertEqual(self.writes(host), [])

    def test_refuses_when_the_site_is_not_healthy_before_starting(self):
        code, log, host = self.run_adopt('rehearsal', FakeHost(self.base, unhealthy={APP_HEALTH}))
        self.assertNotEqual(code, 0)
        self.assertEqual(self.writes(host), [])

    def test_refuses_invalid_deploy_inputs_by_name_only(self):
        code, log, host = self.run_adopt('rehearsal', inputs={**INPUTS, 'POSTGRES_PASSWORD': PASSWORD + '\n'})
        self.assertNotEqual(code, 0)
        self.assertIn('POSTGRES_PASSWORD', log)
        self.assertEqual(host.calls, [])


class RehearsalTest(AdoptTestCase):
    def test_copies_compares_and_removes_the_new_project_and_volume(self):
        code, log, host = self.run_adopt('rehearsal')
        self.assertEqual(code, 0, log)
        self.assertTrue(log.rstrip().endswith('ADOPT_RESULT=ok'))
        self.created_nothing(host)
        self.old_untouched(host)
        steps = [FakeHost.step(call) for call in host.calls]
        # Dump in the counted snapshot, restore, compare, migrations on the copy, then removal.
        for earlier, later in (('dump', 'volume-create'), ('volume-create', 'up'), ('up', 'ready'), ('ready', 'restore'),
                               ('restore', 'count'), ('count', 'run'), ('run', 'down'), ('down', 'volume-rm')):
            self.assertLess(steps.index(earlier), steps.index(later), (earlier, later))
        dump = next(call for call in host.calls if 'pg_dump' in call)
        self.assertIn(f'--snapshot={SNAPSHOT}', dump)
        self.assertIn('repeatable read', host.snapshot_sql)
        self.assertIn(['run', '--rm', '-T', '--no-deps', 'migrate'], [call[-5:] for call in host.calls])
        self.assertNotIn('release', steps)
        # The dump and the log stay; nothing else of the new layout.
        dump_file = self.base / 'backups' / f'{self.stamp}-adopt' / 'database.dump'
        self.assertEqual(dump_file.read_bytes(), b'PGDMP-old')
        self.assertEqual(dump_file.stat().st_mode & 0o777, 0o600)
        for table, rows in COUNTS.items():
            self.assertRegex(log, rf'{re.escape(table)}\s+{rows}\s+{rows}')

    def test_the_new_volume_carries_the_owner_label(self):
        host = FakeHost(self.base)
        labels = {}
        original = host.answer

        def answer(args, kwargs):
            result = original(args, kwargs)
            if args[1:3] == ['volume', 'create']:
                labels.update(host.volumes[args[-1]])
            return result
        host.answer = answer
        self.run_adopt('rehearsal', host)
        self.assertEqual(labels, {SITE.volume_owner_label: SITE.project})

    def test_a_row_count_mismatch_fails_and_still_removes_everything_new(self):
        code, log, host = self.run_adopt('rehearsal', FakeHost(self.base, new_counts={**COUNTS, 'public.udis': 1199}))
        self.assertNotEqual(code, 0)
        self.assertIn('public.udis', log)
        self.created_nothing(host)
        self.old_untouched(host)

    def test_a_missing_table_in_the_copy_is_a_mismatch(self):
        counts = {k: v for k, v in COUNTS.items() if k != 'public.sync_jobs'}
        code, log, host = self.run_adopt('rehearsal', FakeHost(self.base, new_counts=counts))
        self.assertNotEqual(code, 0)
        self.assertIn('public.sync_jobs', log)
        self.created_nothing(host)

    def test_a_failed_restore_removes_everything_new(self):
        code, log, host = self.run_adopt('rehearsal', FakeHost(self.base, fail={'step:restore'}))
        self.assertNotEqual(code, 0)
        self.created_nothing(host)
        self.old_untouched(host)
        self.assertTrue((self.base / 'backups' / f'{self.stamp}-adopt' / 'database.dump').exists())

    def test_an_interruption_removes_everything_new(self):
        host = FakeHost(self.base)
        original = host.answer

        def answer(args, kwargs):
            if FakeHost.step(args) == 'count':
                raise adopt.Interrupted('signal 15')
            return original(args, kwargs)
        host.answer = answer
        code, log, host = self.run_adopt('rehearsal', host)
        self.assertNotEqual(code, 0)
        self.created_nothing(host)
        self.old_untouched(host)


class CutoverTest(AdoptTestCase):
    def test_switches_with_the_old_web_serving_until_the_new_one_serves_alone(self):
        code, log, host = self.run_adopt('cutover')
        self.assertEqual(code, 0, log)
        self.assertTrue(log.rstrip().endswith('ADOPT_RESULT=ok'))
        # The first kit release ran on the copied, labelled volume with runtime.json already written.
        saw = host.release_saw
        self.assertEqual(saw['runtime'], release.runtime_config(INPUTS))
        self.assertEqual(saw['input'], INPUTS)
        self.assertEqual(saw['input_mode'], 0o600)
        self.assertEqual(saw['volume_label'], {SITE.volume_owner_label: SITE.project})
        self.assertTrue(saw['old_web_running'])
        steps = [FakeHost.step(call) for call in host.calls]
        self.assertLess(steps.index('count'), steps.index('release'))
        drain = next(i for i, call in enumerate(host.calls) if call[-2:] == ['touch', '/tmp/draining'])
        self.assertEqual(host.calls[drain][2], 'old-web-1')
        self.assertLess(steps.index('release'), drain)
        # The public site answers with the old web drained, before the old web stops.
        self.assertIn(APP_HEALTH, host.health_calls)
        self.assertLess(drain, steps.index('stop-web'))
        self.assertLess(steps.index('stop-web'), steps.index('stop-postgres'))
        # Kept: the new project and volume, the old containers (stopped), their volumes, directory and the dump.
        self.assertIn(SITE.database_volume, host.volumes)
        self.assertEqual(len(host.ids('fontus-prod', 'web')), 1)
        self.assertFalse(host.containers['old-web-1']['running'])
        self.assertFalse(host.containers['old-postgres-1']['running'])
        self.assertIn('old-web-1', host.containers)
        self.assertIn('eau-robinet_pgdata18', host.volumes)
        self.assertEqual((self.old_dir / '.env').read_text(), OLD_ENV)
        self.assertTrue((self.base / 'backups' / f'{self.stamp}-adopt' / 'database.dump').exists())
        self.assertTrue((self.base / 'runtime.json').exists())
        self.assertFalse(any(call[1:3] == ['volume', 'rm'] or call[1:2] == ['rm'] for call in host.calls))
        self.assertFalse((self.release_dir / 'deploy-input.json').exists())
        self.assertEqual((self.base / 'runtime.json').stat().st_mode & 0o777, 0o600)

    def test_a_row_count_mismatch_aborts_before_any_switch(self):
        code, log, host = self.run_adopt('cutover', FakeHost(self.base, new_counts={**COUNTS, 'public.samples': 1}))
        self.assertNotEqual(code, 0)
        self.assertNotIn('release', [FakeHost.step(call) for call in host.calls])
        self.created_nothing(host)
        self.old_untouched(host)

    def test_a_failed_release_removes_what_the_adoption_created(self):
        code, log, host = self.run_adopt('cutover', FakeHost(self.base, fail={'step:release'}))
        self.assertNotEqual(code, 0)
        self.assertTrue(log.rstrip().endswith('ADOPT_RESULT=failed'))
        self.created_nothing(host)
        self.old_untouched(host)
        self.assertFalse((self.release_dir / 'deploy-input.json').exists())
        self.assertTrue((self.base / 'backups' / f'{self.stamp}-adopt' / 'database.dump').exists())

    def test_a_new_web_not_serving_alone_brings_the_old_one_back_and_removes_the_new(self):
        host = FakeHost(self.base)
        original = host.check_health

        def check_health(url):
            # Healthy while the old web is in rotation, unreachable once it is drained.
            if url == APP_HEALTH and 'old-web-1' in host.drained:
                raise OSError('no server')
            return original(url)
        host.check_health = check_health
        code, log, host = self.run_adopt('cutover', host)
        self.assertNotEqual(code, 0)
        self.assertNotIn('old-web-1', host.drained)
        self.assertIn(['docker', 'exec', 'old-web-1', 'rm', '/tmp/draining'], host.calls)
        # The new web leaves the rotation before it is removed.
        steps = [FakeHost.step(call) for call in host.calls]
        new_drain = max(i for i, call in enumerate(host.calls) if call[-2:] == ['touch', '/tmp/draining'] and 'new-web' in call[2])
        self.assertLess(new_drain, steps.index('down'))
        self.created_nothing(host)
        self.old_untouched(host)

    def test_a_failure_after_the_old_web_stopped_keeps_the_new_site(self):
        code, log, host = self.run_adopt('cutover', FakeHost(self.base, fail={'step:stop-postgres'}))
        self.assertNotEqual(code, 0)
        self.assertTrue(log.rstrip().endswith('ADOPT_RESULT=failed-after-switch'))
        self.assertIn(SITE.database_volume, host.volumes)
        self.assertEqual(len(host.ids('fontus-prod', 'web')), 1)
        self.assertTrue((self.base / 'runtime.json').exists())
        self.assertFalse(any(FakeHost.step(call) in ('down', 'volume-rm') for call in host.calls))


class DetachedRunTest(AdoptTestCase):
    def setUp(self):
        super().setUp()
        self.script = self.release_dir / 'deploy' / 'adopt.py'
        patch = mock.patch.object(adopt, '__file__', str(self.script))
        patch.start()
        self.addCleanup(patch.stop)
        site = dataclasses.replace(SITE, directory=self.base)
        patch = mock.patch.object(adopt, 'SITE', site)
        patch.start()
        self.addCleanup(patch.stop)

    def write_input(self, inputs=INPUTS):
        (self.release_dir / 'deploy-input.json').write_text(json.dumps(inputs))

    def start(self, *args, background=None):
        calls = []
        output = io.StringIO()
        with contextlib.redirect_stdout(output):
            code = adopt.start(['--stamp', self.stamp, *args], background=background or (lambda *a: calls.append(a)))
        return code, output.getvalue(), calls

    def test_start_reads_and_deletes_the_input_then_runs_in_the_background(self):
        self.write_input()
        code, output, calls = self.start('--mode', 'rehearsal')
        self.assertEqual(code, 0)
        self.assertFalse((self.release_dir / 'deploy-input.json').exists())
        self.assertEqual(len(calls), 1)
        mode, inputs, release_dir, stamp, log_fd, lock = calls[0]
        self.assertEqual((mode, inputs, release_dir, stamp), ('rehearsal', INPUTS, self.release_dir, self.stamp))
        log = self.base / 'backups' / f'{self.stamp}-adopt.log'
        self.assertEqual(log.stat().st_mode & 0o777, 0o600)
        self.assertIn(str(log), output)
        os.close(log_fd)
        os.close(lock)

    def test_start_refuses_a_cutover_without_the_snapshot(self):
        self.write_input()
        with self.assertRaises(SystemExit), contextlib.redirect_stderr(io.StringIO()):
            self.start('--mode', 'cutover')
        self.assertFalse((self.release_dir / 'deploy-input.json').exists())
        self.write_input()
        code, _, calls = self.start('--mode', 'cutover', '--snapshot-done')
        self.assertEqual(code, 0)
        self.assertEqual(calls[0][0], 'cutover')
        os.close(calls[0][4])
        os.close(calls[0][5])

    def test_start_refuses_while_another_adoption_holds_the_lock(self):
        self.write_input()
        _, _, calls = self.start('--mode', 'rehearsal')
        self.write_input()
        with self.assertRaises(RuntimeError):
            self.start('--mode', 'rehearsal')
        os.close(calls[0][4])
        os.close(calls[0][5])

    def test_status_reports_new_log_bytes_and_the_state(self):
        self.write_input()
        _, _, calls = self.start('--mode', 'rehearsal')
        log_fd, lock = calls[0][4], calls[0][5]
        os.write(log_fd, b'[08:15:00] first\n')
        first = adopt.status(self.stamp, 0)
        self.assertEqual((first['text'], first['state']), ('[08:15:00] first\n', 'running'))
        os.write(log_fd, b'ADOPT_RESULT=ok\n')
        second = adopt.status(self.stamp, first['size'])
        self.assertEqual((second['text'], second['state']), ('ADOPT_RESULT=ok\n', 'ok'))
        os.close(log_fd)
        os.close(lock)
        self.assertEqual(adopt.status(self.stamp, second['size'])['state'], 'ok')

    def test_status_reports_a_vanished_process(self):
        self.write_input()
        _, _, calls = self.start('--mode', 'rehearsal')
        os.close(calls[0][4])
        os.close(calls[0][5])
        self.assertEqual(adopt.status(self.stamp, 0)['state'], 'gone')

    def test_stamp_and_mode_are_validated(self):
        self.write_input()
        for args in (['--mode', 'rollback'], ['--mode', 'rehearsal', '--stamp', '../x']):
            with self.assertRaises(SystemExit), contextlib.redirect_stderr(io.StringIO()):
                adopt.start(args if '--stamp' in args else ['--stamp', self.stamp, *args], background=lambda *a: None)


class RunnerTest(unittest.TestCase):
    ENV = {'GITHUB_REF': 'refs/heads/main', 'GITHUB_ACTIONS': 'true', 'GITHUB_SHA': SHA, 'ADOPT_MODE': 'rehearsal',
           'SNAPSHOT_DONE': 'false', **INPUTS}

    def dispatch(self, env, statuses):
        sent = []
        replies = iter(statuses)

        @contextlib.contextmanager
        def connection():
            def execute(command, **kwargs):
                sent.append((command, kwargs))
                if ' status ' in command:
                    reply = next(replies)
                    if isinstance(reply, Exception):
                        raise reply
                    return subprocess.CompletedProcess(command, 0, json.dumps(reply).encode(), b'')
                return subprocess.CompletedProcess(command, 0, b'', b'')
            yield execute

        output = io.StringIO()
        with mock.patch.dict(os.environ, env, clear=True), contextlib.redirect_stdout(output):
            code = adopt.dispatch_main(connection=connection, sleep=lambda s: None,
                                       now=lambda: datetime.datetime(2026, 11, 20, 8, 15, tzinfo=datetime.timezone.utc))
        return code, sent, output.getvalue()

    def test_ships_the_release_like_dispatch_then_follows_the_log_through_ssh_loss(self):
        statuses = [{'text': '[08:15:00] a\n', 'size': 13, 'state': 'running'},
                    subprocess.CalledProcessError(255, 'ssh'),
                    {'text': 'ADOPT_RESULT=ok\n', 'size': 29, 'state': 'ok'}]
        code, sent, output = self.dispatch(self.ENV, statuses)
        self.assertEqual(code, 0)
        directory = f'{SITE.directory}/releases/{SHA}'
        upload, launch, *polls = sent
        self.assertIn(f'{directory}/deploy/adopt.py', upload[0])
        self.assertEqual(upload[1]['input'], (DEPLOY / 'adopt.py').read_bytes())
        self.assertTrue(launch[0].startswith("trap '' PIPE HUP; umask 077;"))
        self.assertIn(f'adopt.py start --mode rehearsal --stamp 20261120T081500Z', launch[0])
        self.assertNotIn('--snapshot-done', launch[0])
        with tarfile.open(fileobj=io.BytesIO(launch[1]['input'])) as tar:
            self.assertEqual(tar.getnames(), [*dispatch.BUNDLE, 'deploy-input.json'])
            sent_inputs = json.loads(tar.extractfile('deploy-input.json').read())
        self.assertEqual(sorted(sent_inputs), sorted(site_config.input_keys(SITE)))
        self.assertEqual(len(polls), 3)
        self.assertIn('--offset 13', polls[2][0])
        self.assertIn('[08:15:00] a', output)
        for command, _ in sent:
            for secret in SECRETS:
                self.assertNotIn(secret, command)

    def test_a_failed_or_vanished_adoption_fails_the_job(self):
        for state in ('failed', 'failed-after-switch', 'gone'):
            code, _, _ = self.dispatch(self.ENV, [{'text': '', 'size': 0, 'state': state}])
            self.assertNotEqual(code, 0, state)

    def test_cutover_needs_the_snapshot_flag(self):
        with self.assertRaises(RuntimeError):
            self.dispatch({**self.ENV, 'ADOPT_MODE': 'cutover'}, [])
        code, sent, _ = self.dispatch({**self.ENV, 'ADOPT_MODE': 'cutover', 'SNAPSHOT_DONE': 'true'},
                                      [{'text': '', 'size': 0, 'state': 'ok'}])
        self.assertIn('--mode cutover --stamp 20261120T081500Z --snapshot-done', sent[1][0])

    def test_runs_only_from_main_in_ci(self):
        for env in ({**self.ENV, 'GITHUB_REF': 'refs/heads/other'}, {**self.ENV, 'GITHUB_ACTIONS': ''}, {**self.ENV, 'ADOPT_MODE': 'x'}):
            with self.assertRaises((RuntimeError, ValueError)):
                self.dispatch(env, [])

    def test_adopt_is_not_a_kit_file(self):
        self.assertNotIn('adopt.py', site_config.KIT_FILES)
        self.assertNotIn('adopt.py', (DEPLOY / 'KIT.sha256').read_text())


class WorkflowTest(unittest.TestCase):
    text = (ROOT / '.github' / 'workflows' / 'adopt.yml').read_text(encoding='utf-8')

    def test_manual_only_with_mode_and_snapshot_inputs(self):
        trigger = self.text[self.text.index('\non:\n'):self.text.index('\npermissions:')]
        self.assertIn('workflow_dispatch:', trigger)
        for event in ('push:', 'schedule:', 'pull_request'):
            self.assertNotIn(event, trigger)
        self.assertRegex(trigger, r'mode:\n(?:        .*\n)*?        type: choice\n(?:        .*\n)*?        options: \[rehearsal, cutover\]')
        self.assertRegex(trigger, r'snapshot_done:\n(?:        .*\n)*?        type: boolean\n(?:        .*\n)*?        required: true')

    def test_production_environment_and_every_deploy_input(self):
        self.assertIn('    environment: production\n', self.text)
        for key in site_config.input_keys(SITE):
            self.assertRegex(self.text, rf'\n      {key}: \$\{{\{{|echo "{key}=', key)

    def test_refuses_a_cutover_without_snapshot_and_after_the_deploy_is_enabled(self):
        self.assertIn('      SNAPSHOT_DONE: ${{ inputs.snapshot_done }}\n', self.text)
        self.assertIn('      DEPLOY_ENABLED: ${{ vars.PRODUCTION_DEPLOY_ENABLED }}\n', self.text)
        guard = self.text.index('- name: Refuse')
        step = self.text[guard:self.text.index('\n      - ', guard + 1)]
        self.assertIn('[ "${ADOPT_MODE}" = \'cutover\' ] && [ "${SNAPSHOT_DONE}" != \'true\' ]', step)
        self.assertIn('[ "${DEPLOY_ENABLED}" = \'true\' ]', step)
        self.assertLess(guard, self.text.index('actions/checkout'))

    def test_validates_settings_and_images_before_reaching_the_server(self):
        run = self.text.index('run: python3 deploy/adopt.py dispatch')
        self.assertLess(self.text.index('run: python3 deploy/preflight.py'), run)
        self.assertLess(self.text.index('docker manifest inspect "$OPS_IMAGE"'), run)

    def test_uses_the_kit_ssh_transport_and_no_third_party_ssh_action(self):
        uses = re.findall(r'uses: ([^@\s]+)@', self.text)
        self.assertEqual(sorted(set(uses)), ['actions/checkout', 'docker/login-action'])
        self.assertIn('python3 deploy/adopt.py dispatch', self.text)
        self.assertNotIn('${{ inputs.', self.text[self.text.index('run: python3 deploy/adopt.py'):].split('\n')[0])


if __name__ == '__main__':
    unittest.main()
