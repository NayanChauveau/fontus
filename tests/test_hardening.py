"""Hardening checks on the Dockerfile and on the production compose file (ported from manon-karsenti)."""
import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DOCKERFILE = (ROOT / 'Dockerfile').read_text(encoding='utf-8')
COMPOSE = (ROOT / 'docker-compose.prod.yml').read_text(encoding='utf-8')


def service(name):
    match = re.search(rf'^  {name}:\n((?:(?:    .*)?\n)*)', COMPOSE, re.M)
    assert match, name
    return match.group(1)


def stage(name):
    match = re.search(rf'^FROM \S+ AS {name}\n(.*?)(?=^FROM |\Z)', DOCKERFILE, re.M | re.S)
    assert match, name
    return match.group(1)


def base_image(name):
    match = re.search(rf'^FROM (\S+) AS {name}$', DOCKERFILE, re.M)
    assert match, name
    return match.group(1)


def cmd(name):
    commands = re.findall(r'^CMD (.+)$', stage(name), re.M)
    assert len(commands) == 1, (name, commands)
    return commands[0]


class ImageHardeningTest(unittest.TestCase):
    def test_runtime_is_debian_slim_node_24_without_package_managers(self):
        self.assertRegex(base_image('runtime'), r'^node:24\.[\d.]+-bookworm-slim$')
        runtime = stage('runtime')
        for path in ('/usr/local/lib/node_modules/npm', '/usr/local/lib/node_modules/corepack',
                     '/usr/local/bin/npm', '/usr/local/bin/npx', '/usr/local/bin/corepack',
                     '/usr/local/bin/yarn'):
            self.assertIn(path, runtime, path)
        for name in ('ops', 'production'):
            self.assertEqual(base_image(name), 'runtime', name)
            self.assertNotRegex(stage(name), r'corepack|pnpm|npm ', name)

    def test_code_belongs_to_root_only_the_next_caches_to_the_app_user(self):
        self.assertNotIn('--chown', DOCKERFILE)
        self.assertNotRegex(DOCKERFILE, r'chown -R')
        chowns = re.findall(r'chown (\S+) ([^\n\\]+)', DOCKERFILE)
        self.assertEqual(chowns, [('app:app', '.next/cache .next/server/route-cache')])
        self.assertIn('--uid 1001', stage('runtime'))
        for name in ('ops', 'production'):
            self.assertIn('USER app', stage(name), name)

    def test_web_server_does_not_run_migrations(self):
        production = stage('production')
        self.assertEqual(cmd('production'), '["node", "server.js"]')
        self.assertNotIn('migrat', production)

    def test_ops_target_runs_the_migrations_and_nothing_else(self):
        ops = stage('ops')
        self.assertEqual(cmd('ops'), '["node", "run-migrations.mjs"]')
        self.assertIn('supabase/migrations', ops)
        self.assertNotIn('server.js', ops)
        self.assertNotIn('.next', ops)

    def test_production_is_the_default_target(self):
        last = re.findall(r'^FROM \S+ AS (\S+)$', DOCKERFILE, re.M)[-1]
        self.assertEqual(last, 'production')

    def test_image_has_no_site_port(self):
        self.assertNotRegex(DOCKERFILE, r'EXPOSE|ENV PORT')

    def test_drain_flag_lives_in_the_writable_tmp(self):
        readiness = (ROOT / 'src/app/api/ready/readiness.ts').read_text(encoding='utf-8')
        self.assertIn('DRAIN_FLAG = "/tmp/draining"', readiness)


class ComposeHardeningTest(unittest.TestCase):
    def test_web_container_gains_nothing_and_cannot_write_its_code(self):
        web = service('web')
        self.assertIn("    security_opt: ['no-new-privileges:true']\n", web)
        self.assertIn('    cap_drop: [ALL]\n', web)
        self.assertIn('    read_only: true\n', web)
        # Writable in memory only: the deploy's drain flag (/tmp/draining) and the Next.js caches
        # (page cache, route cache: robots, sitemap, icons and OG images).
        for mount in (
            '/tmp:size=64m,mode=1777',
            '/app/.next/cache:size=64m,uid=1001,gid=1001,mode=0700',
            '/app/.next/server/route-cache:size=64m,uid=1001,gid=1001,mode=0700',
        ):
            self.assertIn(f'      - {mount}\n', web)

    def test_limits_and_log_rotation(self):
        app = re.search(r'^x-app: &app\n((?:(?:  .*)?\n)*)', COMPOSE, re.M).group(1)
        self.assertIn('  logging: &logging\n', app)
        self.assertIn("max-size: '10m'", app)
        self.assertIn("max-file: '3'", app)
        self.assertIn('    logging: *logging\n', service('postgres'))
        self.assertIn('    mem_limit: 768m\n', service('web'))
        self.assertIn('    mem_limit: 512m\n', service('postgres'))
        for name in ('web', 'postgres'):
            self.assertIn('    pids_limit: 256\n', service(name), name)

    def test_compose_file_takes_every_site_value_from_the_kit(self):
        self.assertNotRegex(COMPOSE, r'(?m)^name:')
        for variable in ['SITE_TRAEFIK_NAME', 'SITE_PORT', 'SITE_DB_NAME', 'SITE_DB_USER', 'SITE_VOLUME_DATABASE']:
            self.assertIn('${' + variable, COMPOSE, variable)

    def test_every_compose_call_of_the_kit_names_its_project(self):
        for script in ['release.py', 'smoke.py']:
            text = (ROOT / 'deploy' / script).read_text(encoding='utf-8')
            self.assertRegex(text, r"'(?:--project-name|-p)'", script)


if __name__ == '__main__':
    unittest.main()
