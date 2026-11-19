"""docker-compose.prod.yml on the deploy kit, rendered the way deploy/release.py renders it.

During the cutover the old container (project eau-robinet) and the new one (fontus-prod) serve
side by side under the same router and service names: Traefik only merges them if both declare
exactly the same labels. TODAY_LABELS is `docker compose config` of the pre-kit compose file
(commit af35d21) with TRAEFIK_HOST=fontus.fr; the kit's render (compose file plus the www
override release.py writes) must equal it.
"""
import importlib.util
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'deploy'))


def module(name):
    spec = importlib.util.spec_from_file_location(name, ROOT / 'deploy' / f'{name}.py')
    result = importlib.util.module_from_spec(spec)
    sys.modules[name] = result
    spec.loader.exec_module(result)
    return result


site_config = module('site_config')
release = module('release')
SITE = site_config.load()
HOST = 'fontus.fr'

TODAY_LABELS = {
    'traefik.docker.network': 'traefik',
    'traefik.enable': 'true',
    'traefik.http.middlewares.fontus-retry.retry.attempts': '3',
    'traefik.http.middlewares.fontus-retry.retry.initialinterval': '100ms',
    'traefik.http.middlewares.fontus-www-redirect.redirectregex.permanent': 'true',
    'traefik.http.middlewares.fontus-www-redirect.redirectregex.regex': '^https://www\\.(.+)',
    'traefik.http.middlewares.fontus-www-redirect.redirectregex.replacement': 'https://$${1}',
    'traefik.http.routers.fontus-www.entrypoints': 'websecure',
    'traefik.http.routers.fontus-www.middlewares': 'fontus-www-redirect',
    'traefik.http.routers.fontus-www.rule': 'Host(`www.fontus.fr`)',
    'traefik.http.routers.fontus-www.service': 'fontus',
    'traefik.http.routers.fontus-www.tls.certresolver': 'le',
    'traefik.http.routers.fontus.entrypoints': 'websecure',
    'traefik.http.routers.fontus.middlewares': 'fontus-retry',
    'traefik.http.routers.fontus.rule': 'Host(`fontus.fr`)',
    'traefik.http.routers.fontus.tls.certresolver': 'le',
    'traefik.http.services.fontus.loadbalancer.healthcheck.interval': '1s',
    'traefik.http.services.fontus.loadbalancer.healthcheck.path': '/api/ready',
    'traefik.http.services.fontus.loadbalancer.healthcheck.timeout': '1s',
    'traefik.http.services.fontus.loadbalancer.server.port': '3100',
}

INPUTS = {
    'WEB_IMAGE': f'{SITE.image_repository}:{"a" * 40}', 'OPS_IMAGE': f'{SITE.image_repository}:{"a" * 40}-ops',
    'TRAEFIK_HOST': HOST, 'TRAEFIK_ALIASES': '', 'PUBLIC_INDEXING': 'true',
    'POSTGRES_PASSWORD': 'p' * 32, 'SENTRY_DSN': ' https://key@sentry.example.org/1 ',
}


def docker_compose_available():
    return shutil.which('docker') is not None and subprocess.run(
        ['docker', 'compose', 'version'], capture_output=True).returncode == 0


def render():
    """The compose configuration release.main would run (same files, same environment)."""
    values = release.runtime_config(INPUTS)
    env = {'PATH': os.environ['PATH'], **values, **site_config.compose_env(SITE)}
    with tempfile.TemporaryDirectory() as directory:
        override = Path(directory) / 'www.compose.json'
        override.write_text(release.www_override(values))
        output = subprocess.run(
            ['docker', 'compose', '--env-file', '/dev/null', '--project-name', SITE.project,
             '-f', str(ROOT / 'docker-compose.prod.yml'), '-f', str(override),
             '--profile', 'operations', 'config', '--format', 'json'],
            env=env, check=True, capture_output=True, cwd=directory).stdout
    return json.loads(output)


@unittest.skipUnless(docker_compose_available(), 'docker compose absent')
class RenderedComposeTest(unittest.TestCase):
    maxDiff = None

    @classmethod
    def setUpClass(cls):
        cls.config = render()
        cls.services = cls.config['services']

    def test_traefik_labels_equal_today_production_labels(self):
        self.assertEqual(self.services['web']['labels'], TODAY_LABELS)

    def test_web_listens_on_the_site_port_with_the_kit_database_url(self):
        environment = self.services['web']['environment']
        self.assertEqual(environment['PORT'], '3100')
        self.assertEqual(environment['DATABASE_URL'], site_config.database_url(SITE, 'p' * 32))
        self.assertEqual(environment['SENTRY_DSN'], 'https://key@sentry.example.org/1')
        self.assertEqual((environment['DATABASE_POOL_MAX'], environment['DATABASE_SSL'], environment['NODE_ENV']),
                         ('5', '0', 'production'))
        self.assertEqual(self.services['web']['image'], INPUTS['WEB_IMAGE'])

    def test_services_and_networks(self):
        self.assertEqual(set(self.services), {'web', 'postgres', 'migrate', 'data-check'})
        self.assertEqual(set(self.services['web']['networks']), {'internal', 'traefik'})
        self.assertEqual(set(self.services['postgres']['networks']), {'internal'})
        self.assertEqual(set(self.services['migrate']['networks']), {'internal'})
        self.assertTrue(self.config['networks']['internal']['internal'])
        traefik = self.config['networks']['traefik']
        self.assertEqual((traefik['name'], traefik['external']), ('traefik', True))
        self.assertNotIn('ports', self.services['postgres'])

    def test_migrate_job_runs_the_ops_image(self):
        migrate = self.services['migrate']
        self.assertEqual(migrate['image'], INPUTS['OPS_IMAGE'])
        self.assertEqual(migrate['profiles'], ['operations'])
        self.assertEqual(migrate['environment']['DATABASE_URL'], site_config.database_url(SITE, 'p' * 32))
        # The ops image's own CMD (node run-migrations.mjs).
        self.assertIsNone(migrate.get('command'))

    def test_database_lives_on_the_labelled_external_volume(self):
        self.assertEqual(self.config['volumes'], {'pgdata': {'name': 'fontus-prod-pgdata18', 'external': True}})
        self.assertEqual(self.services['postgres']['environment']['POSTGRES_DB'], 'fontus')
        self.assertEqual(self.services['postgres']['environment']['POSTGRES_USER'], 'postgres')
        check = self.services['data-check']
        self.assertEqual(check['network_mode'], 'none')
        self.assertTrue(check['volumes'][0]['read_only'])

    def test_the_project_name_comes_from_the_kit(self):
        self.assertEqual(self.config['name'], 'fontus-prod')


class ComposeFileTest(unittest.TestCase):
    def test_www_labels_come_only_from_the_kit_override(self):
        compose = (ROOT / 'docker-compose.prod.yml').read_text(encoding='utf-8')
        self.assertNotIn('-www', compose)
        self.assertNotIn('www.', compose)

    def test_compose_file_names_nothing_of_the_site(self):
        compose = (ROOT / 'docker-compose.prod.yml').read_text(encoding='utf-8')
        for token in ['fontus', 'eau-robinet', '3100']:
            self.assertNotIn(token, compose, token)


if __name__ == '__main__':
    unittest.main()
