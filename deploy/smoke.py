#!/usr/bin/env python3
"""Production-image smoke test, using disposable local/CI resources only.

Kit file (byte-identical in every site): what it checks comes from site.config.json. The ops jobs
(deploy.opsJobs) run twice each (idempotent), the media volume is exercised only when the site has
one (deploy.volumes.media), the pages of smoke.pages must answer with their text, and the module
named by smoke.extension, if any, adds the site's own checks at fixed points (EXTENSION_HOOKS).
"""
import importlib.util
import json
import os
from pathlib import Path
import re
import secrets
import subprocess
import tempfile
import urllib.request
import uuid

import site_config

SITE = site_config.load()
ROOT = Path(__file__).resolve().parents[1]
# A host only used inside this disposable stack (never routed: web labels are replaced below).
TEST_ORIGIN = 'https://shop.example.test'
# Package managers, sources and build tooling that must never reach the web image.
ABSENT_FROM_WEB = ['/usr/local/bin/npm', '/usr/local/bin/corepack', '/pnpm', '/app/src', '/app/node_modules/tsx',
                   '/app/node_modules/typescript', '/app/node_modules/drizzle-kit', '/app/node_modules/.pnpm/node_modules/esbuild']
# Functions a smoke extension may define, each called with the Stack (check_config also gets the
# rendered compose configuration and both images): check_config before anything starts,
# before_web once the ops jobs ran, after_pages once smoke.pages answered, after_recreate once
# both services were recreated, after_health last. Its SUMMARY replaces the closing message.
EXTENSION_HOOKS = ('check_config', 'before_web', 'after_pages', 'after_recreate', 'after_health')
SUMMARY = 'Images web et ops vérifiées : UID non root, runtime minimal, tâches ops idempotentes, pages, sauvegarde et persistance après recréation.'


def load_extension(site):
    """The site's own checks (smoke.extension), or None."""
    if site.smoke_extension is None:
        return None
    spec = importlib.util.spec_from_file_location('smoke_extension', ROOT / site.smoke_extension)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def hook(extension, name, *args):
    function = getattr(extension, name, None)
    if function is not None:
        function(*args)


class Stack:
    """One disposable compose project and HTTP access to its web container (through a local port)."""

    def __init__(self, site, args, password, image, ops_image):
        self.site = site
        self.args = args
        self.password = password
        self.image = image
        self.ops_image = ops_image
        # Free for extensions: values carried from one hook to the next.
        self.state = {}

    def compose(self, *command, capture=False):
        return subprocess.run([*self.args, *command], check=True, capture_output=capture)

    def origin(self):
        port = self.compose('port', 'web', str(self.site.port), capture=True).stdout.decode().strip().rsplit(':', 1)[1]
        return 'http://127.0.0.1:' + port

    def request(self, path, data=None, content_type='application/json', session=None):
        headers = {'Origin': TEST_ORIGIN}
        if data is not None:
            headers['Content-Type'] = content_type
        if session:
            headers['Cookie'] = session
        req = urllib.request.Request(self.origin() + path, data=data, headers=headers)
        with urllib.request.urlopen(req, timeout=20) as response:
            return response.read(), response.headers


def check_config(config, site, image, ops_image):
    services = config['services']
    assert not services['postgres'].get('ports'), 'PostgreSQL ne doit pas être publié'
    assert config['networks']['internal']['internal'] is True
    assert services['web']['labels'][f'traefik.http.routers.{site.traefik_name}.rule'] == f'Host(`{site.default_host}`)'
    assert all('traefik' not in services[service].get('networks', {}) for service in ['postgres', *site.ops_jobs])
    # Web image for the server and the volume helpers; ops image for every one-off job.
    expected = {'web': image, **{job: ops_image for job in site.ops_jobs}}
    if site.media_volume is not None:
        expected.update({'media-init': image, 'media-backup': image})
    assert {name: services[name]['image'] for name in expected} == expected


def isolate(config, site, project, password):
    """Disposable names for everything, no Traefik route, the web port published on 127.0.0.1 only."""
    config['name'] = project
    for key in config['networks']:
        config['networks'][key] = {'name': f'{project}-{key}'}
    for key in config['volumes']:
        config['volumes'][key] = {'name': f'{project}-{key}'}
    config['services']['web']['labels'] = {'traefik.enable': 'false'}
    config['services']['web']['ports'] = [{'target': site.port, 'host_ip': '127.0.0.1', 'published': '0', 'protocol': 'tcp'}]
    if site_config.BOOTSTRAP_JOB in site.ops_jobs:
        config['services'][site_config.BOOTSTRAP_JOB]['environment'].update({
            'BOOTSTRAP_ADMIN_EMAIL': 'smoke@example.test', 'BOOTSTRAP_ADMIN_NAME': 'CI smoke', 'BOOTSTRAP_ADMIN_PASSWORD': password})


def exercise(stack, extension):
    site, compose = stack.site, stack.compose
    web_timeout = str(site.timings.health_timeout_seconds)
    compose('up', '-d', '--wait', '--wait-timeout', '120', 'postgres')
    if site.media_volume is not None:
        compose('run', '--rm', '-T', '--no-deps', 'media-init')
    compose('run', '--rm', '-T', '--no-deps', 'data-check')
    # Every release runs them again on the same database: twice here.
    for job in site.ops_jobs:
        compose('run', '--rm', '-T', '--no-deps', job)
        compose('run', '--rm', '-T', '--no-deps', job)
    hook(extension, 'before_web', stack)
    compose('up', '-d', '--wait', '--wait-timeout', web_timeout, 'web')
    assert compose('exec', '-T', 'web', 'id', '-u', capture=True).stdout.strip() == b'1001'
    compose('exec', '-T', 'web', 'test', '!', '-e', '/app/.env.local')
    for path in ABSENT_FROM_WEB:
        compose('exec', '-T', 'web', 'test', '!', '-e', path)
    # The deploy drains the old container with `touch /tmp/draining` (deploy/release.py rollout_web).
    compose('exec', '-T', 'web', 'touch', '/tmp/draining-check')
    bodies = []
    for page in site.smoke_pages:
        bodies.append(stack.request(page['path'])[0])
        assert page['contains'].encode() in bodies[-1], page['path']
    # Standalone server: the build assets (.next/static) the first page references are served.
    asset = re.search(r'/_next/static/[^"\'\s]+\.(?:js|css)', bodies[0].decode()).group(0)
    assert stack.request(asset)[0]
    hook(extension, 'after_pages', stack)
    dump = compose('exec', '-T', 'postgres', 'pg_dump', '-U', site.db_user, '-d', site.db_name, '-Fc', capture=True).stdout
    assert dump.startswith(b'PGDMP')
    if site.media_volume is not None:
        backup = compose('run', '--rm', '-T', '--no-deps', 'media-backup', capture=True).stdout
        assert backup.startswith(bytes([31, 139]))
    # Recreate both services; stable named volumes must retain all data.
    compose('stop', 'web', 'postgres')
    compose('up', '-d', '--force-recreate', '--wait', '--wait-timeout', '120', 'postgres')
    compose('up', '-d', '--force-recreate', '--wait', '--wait-timeout', web_timeout, 'web')
    hook(extension, 'after_recreate', stack)
    assert json.loads(stack.request('/api/health')[0])['status'] == 'ok'
    hook(extension, 'after_health', stack)


def main(site=SITE):
    extension = load_extension(site)
    project = f'{site.slug}-ci-' + uuid.uuid4().hex[:12]
    image = os.environ.get('SMOKE_IMAGE', f'{site.slug}:ci')
    ops_image = os.environ.get('SMOKE_OPS_IMAGE', image + '-ops')
    password = secrets.token_hex(24)
    env = {**os.environ, **site_config.compose_env(site), 'WEB_IMAGE': image, 'OPS_IMAGE': ops_image, 'POSTGRES_PASSWORD': password,
           'DATABASE_URL': site_config.database_url(site, password), 'APP_URL': TEST_ORIGIN, 'TRAEFIK_HOST': site.default_host}
    # Other required secrets (deploy.requiredSecrets), random: the stack never outlives this run.
    env.update({key: secrets.token_hex(32) for key in site.required_secrets if key != 'POSTGRES_PASSWORD'})
    rendered = subprocess.check_output(['docker', 'compose', '--env-file', '/dev/null', '-f', 'docker-compose.prod.yml', '--profile', 'operations', 'config', '--format', 'json'], env=env)
    config = json.loads(rendered)
    check_config(config, site, image, ops_image)
    hook(extension, 'check_config', config, image, ops_image)
    isolate(config, site, project, password)
    with tempfile.TemporaryDirectory(prefix=project) as directory:
        file = Path(directory) / 'compose.json'
        file.write_text(json.dumps(config))
        file.chmod(0o600)
        stack = Stack(site, ['docker', 'compose', '--env-file', '/dev/null', '-p', project, '-f', str(file)], password, image, ops_image)
        try:
            exercise(stack, extension)
            print(getattr(extension, 'SUMMARY', SUMMARY))
        finally:
            # This file only ever uses a freshly generated <slug>-ci-* project and volume names.
            assert project.startswith(f'{site.slug}-ci-') and all(v['name'].startswith(project + '-') for v in config['volumes'].values())
            stack.compose('down', '--volumes', '--remove-orphans')


if __name__ == '__main__':
    main()
