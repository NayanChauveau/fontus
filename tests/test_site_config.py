"""Fontus's site.config.json, read by the deploy kit (deploy/site_config.py)."""
import importlib.util
from pathlib import Path
import sys
import unittest

ROOT = Path(__file__).resolve().parents[1]


def module(name):
    spec = importlib.util.spec_from_file_location(name, ROOT / 'deploy' / f'{name}.py')
    result = importlib.util.module_from_spec(spec)
    # Registered first: dataclasses look their module up in sys.modules.
    sys.modules[name] = result
    spec.loader.exec_module(result)
    return result


site_config = module('site_config')


class SiteConfigTest(unittest.TestCase):
    def test_standard_names(self):
        site = site_config.load()
        self.assertEqual(site.slug, 'fontus')
        self.assertEqual(str(site.directory), '/srv/fontus')
        self.assertEqual(site.project, 'fontus-prod')
        self.assertEqual(site.traefik_name, 'fontus')
        self.assertEqual(site.image_repository, 'ghcr.io/nayanchauveau/fontus')
        self.assertEqual(site.volume_owner_label, 'fontus.owner')
        self.assertEqual((site.database_volume, site.media_volume, site.legacy_database_volume),
                         ('fontus-prod-pgdata18', None, None))
        self.assertEqual((site.db_name, site.db_user), ('fontus', 'postgres'))
        self.assertEqual(site.port, 3100)

    def test_hosts(self):
        site = site_config.load()
        self.assertEqual(site.default_host, 'fontus.fr')
        self.assertEqual(site.protected_hosts, ('manonkarsenti.com',))
        self.assertEqual(site.protected_health_url, 'https://manonkarsenti.com/api/health')

    def test_deploy_options(self):
        site = site_config.load()
        self.assertEqual(site.ops_jobs, ('migrate',))
        self.assertEqual(site.required_secrets, ('POSTGRES_PASSWORD',))
        self.assertEqual(site.optional_secrets, ('SENTRY_DSN',))
        self.assertEqual((site.payments, site.email, site.quiet_window, site.www_redirect), (False, False, False, True))
        self.assertEqual(site.timings, site_config.Timings(settle_seconds=5, drain_seconds=4, health_timeout_seconds=180))

    def test_compose_values_have_no_media(self):
        site = site_config.load()
        self.assertEqual(site_config.compose_env(site), {
            'SITE_TRAEFIK_NAME': 'fontus', 'SITE_PORT': '3100', 'SITE_DB_NAME': 'fontus',
            'SITE_DB_USER': 'postgres', 'SITE_VOLUME_DATABASE': 'fontus-prod-pgdata18',
        })
        self.assertFalse(site_config.remote_values(site)['media'])

    def test_deploy_inputs(self):
        keys = site_config.input_keys(site_config.load())
        self.assertEqual(keys, ['WEB_IMAGE', 'OPS_IMAGE', 'TRAEFIK_HOST', 'TRAEFIK_ALIASES', 'PUBLIC_INDEXING',
                                'POSTGRES_PASSWORD', 'SENTRY_DSN', 'GHCR_USER', 'GHCR_TOKEN'])

    def test_database_url_matches_the_compose_service(self):
        self.assertEqual(site_config.database_url(site_config.load(), 'p@ss'),
                         'postgresql://postgres:p%40ss@postgres:5432/fontus')

    def test_smoke_pages_and_no_extension(self):
        site = site_config.load()
        self.assertEqual([page['path'] for page in site.smoke_pages],
                         ['/', '/faq', '/robots.txt', '/sitemap.xml', '/opengraph-image'])
        self.assertIsNone(site.smoke_extension)

    def test_github_lists_name_what_the_workflows_read(self):
        import json
        github = json.loads((ROOT / 'site.config.json').read_text())['github']
        workflows = ''.join(path.read_text() for path in (ROOT / '.github/workflows').glob('*.yml'))
        for name in github['secrets']:
            self.assertIn(f'secrets.{name} ', workflows, name)
        for name in github['variables']:
            self.assertIn(f'vars.{name}', workflows, name)


if __name__ == '__main__':
    unittest.main()
