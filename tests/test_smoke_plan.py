"""What deploy/smoke.py does for Fontus (no media, one ops job, no extension), Docker and HTTP replaced."""
from pathlib import Path
import sys
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parent))
import smoke_harness  # noqa: E402

sys.path.insert(0, str(smoke_harness.ROOT / 'deploy'))
import site_config  # noqa: E402

SITE = site_config.load()
RUN = ['run', '--rm', '-T', '--no-deps']
ABSENT = ['/usr/local/bin/npm', '/usr/local/bin/corepack', '/pnpm', '/app/src', '/app/node_modules/tsx',
          '/app/node_modules/typescript', '/app/node_modules/drizzle-kit', '/app/node_modules/.pnpm/node_modules/esbuild']


@unittest.skipUnless(smoke_harness.docker_available(), 'docker compose absent')
class SmokePlanTest(unittest.TestCase):
    maxDiff = None

    @classmethod
    def setUpClass(cls):
        cls.steps, cls.compose_file, cls.output = smoke_harness.trace(pages=SITE.smoke_pages)

    def test_compose_calls_in_order(self):
        calls = [step['compose'] for step in self.steps if 'compose' in step and step['compose'][0] != 'port']
        self.assertEqual(calls, [
            ['up', '-d', '--wait', '--wait-timeout', '120', 'postgres'],
            [*RUN, 'data-check'],
            [*RUN, 'migrate'],
            [*RUN, 'migrate'],
            ['up', '-d', '--wait', '--wait-timeout', '180', 'web'],
            ['exec', '-T', 'web', 'id', '-u'],
            ['exec', '-T', 'web', 'test', '!', '-e', '/app/.env.local'],
            *[['exec', '-T', 'web', 'test', '!', '-e', path] for path in ABSENT],
            ['exec', '-T', 'web', 'touch', '/tmp/draining-check'],
            ['exec', '-T', 'postgres', 'pg_dump', '-U', 'postgres', '-d', 'fontus', '-Fc'],
            ['stop', 'web', 'postgres'],
            ['up', '-d', '--force-recreate', '--wait', '--wait-timeout', '120', 'postgres'],
            ['up', '-d', '--force-recreate', '--wait', '--wait-timeout', '180', 'web'],
            ['down', '--volumes', '--remove-orphans'],
        ])

    def test_pages_then_the_asset_then_health(self):
        requests = [step['request'] for step in self.steps if 'request' in step]
        self.assertEqual(requests, ['/', '/faq', '/robots.txt', '/sitemap.xml', '/opengraph-image',
                                    smoke_harness.ASSET, '/api/health'])

    def test_the_stack_is_isolated(self):
        config = self.compose_file
        self.assertTrue(config['name'].startswith('fontus-ci-'))
        self.assertEqual(config['services']['web']['labels'], {'traefik.enable': 'false'})
        self.assertEqual(config['services']['web']['ports'][0]['host_ip'], '127.0.0.1')
        for kind in ('networks', 'volumes'):
            for value in config[kind].values():
                self.assertTrue(value['name'].startswith(config['name'] + '-'), value)
                self.assertNotIn('external', value)

    def test_closing_message_is_the_kit_one(self):
        self.assertIn('tâches ops idempotentes', self.output)


if __name__ == '__main__':
    unittest.main()
