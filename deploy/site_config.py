"""Per-site values for the deploy scripts, read from site.config.json (repository root).

Standard library only: this runs on the VPS. The consistency rules are the same as parseSite
(src/core/site.ts): a configuration edited only in part, still pointing at another site's
directory, compose project, volumes, routers or image, is refused before any deploy step.
"""
from __future__ import annotations

from dataclasses import dataclass
import json
import os
from pathlib import Path
import re
import sys
from urllib.parse import quote

DEFAULT_PATH = Path(__file__).resolve().parents[1] / 'site.config.json'
SLUG = re.compile(r'[a-z0-9]+(?:-[a-z0-9]+)*')
IMAGE_REPOSITORY = re.compile(r'ghcr\.io/[a-z0-9_.-]+/[a-z0-9_.-]+')
OWNER_LABEL = re.compile(r'[a-z0-9-]+\.owner')
SHA = re.compile(r'[0-9a-f]{40}')
SECRET_NAME = re.compile(r'[A-Z][A-Z0-9_]*')
# Inputs every site sends; the secrets and the optional modules below are chosen by site.config.json.
BASE_INPUTS = ('WEB_IMAGE', 'OPS_IMAGE', 'TRAEFIK_HOST', 'TRAEFIK_ALIASES', 'PUBLIC_INDEXING')
REGISTRY_INPUTS = ('GHCR_USER', 'GHCR_TOKEN')
PAYMENT_INPUTS = ('STRIPE_MODE', 'STRIPE_TEST_SECRET_KEY', 'STRIPE_TEST_WEBHOOK_SECRET', 'STRIPE_LIVE_SECRET_KEY', 'STRIPE_LIVE_WEBHOOK_SECRET')
EMAIL_INPUTS = ('EMAIL_MODE', 'SMTP_URL', 'EMAIL_FROM', 'EMAIL_REPLY_TO')
# The bootstrap-admin ops job reads these; they reach its container only, never runtime.json.
BOOTSTRAP_JOB = 'bootstrap-admin'
BOOTSTRAP_INPUTS = ('BOOTSTRAP_ADMIN_EMAIL', 'BOOTSTRAP_ADMIN_NAME', 'BOOTSTRAP_ADMIN_PASSWORD')
# Services the release manages itself: never an ops job.
RESERVED_SERVICES = ('web', 'postgres', 'data-check', 'media-init', 'media-backup')
# The kit's own files (deploy/KIT.sha256): byte-identical in every site, never a smoke extension.
KIT_FILES = ('dispatch.py', 'preflight.py', 'release.py', 'site_config.py', 'smoke.py', 'ssh_connection.py')
# A site's own smoke checks (deploy/smoke.py loads it): a module of this repository's deploy/ folder.
SMOKE_EXTENSION = re.compile(r'deploy/[a-z][a-z0-9_]*\.py')


@dataclass(frozen=True)
class Timings:
    """Container swap timings (deploy/release.py rollout_web)."""
    settle_seconds: int = 5
    drain_seconds: int = 4
    health_timeout_seconds: int = 150


@dataclass(frozen=True)
class Site:
    slug: str
    port: int
    directory: Path
    project: str
    image_repository: str
    volume_owner_label: str
    database_volume: str
    media_volume: str | None
    legacy_database_volume: str | None
    db_name: str
    db_user: str
    traefik_name: str
    default_host: str
    protected_hosts: tuple
    protected_health_url: str
    ops_jobs: tuple
    required_secrets: tuple
    optional_secrets: tuple
    payments: bool
    email: bool
    quiet_window: bool
    www_redirect: bool
    timings: Timings
    smoke_pages: tuple = ()
    smoke_extension: str | None = None


def _check(ok: bool, key: str) -> None:
    if not ok:
        raise ValueError(f'site.config.json : {key} incohérent')


TIMING_KEYS = {'settleSeconds': 'settle_seconds', 'drainSeconds': 'drain_seconds', 'healthTimeoutSeconds': 'health_timeout_seconds'}


def _timings(value) -> Timings:
    _check(isinstance(value, dict) and set(value) <= set(TIMING_KEYS), 'deploy.timings')
    for seconds in value.values():
        _check(type(seconds) is int and 1 <= seconds <= 900, 'deploy.timings')
    return Timings(**{TIMING_KEYS[key]: seconds for key, seconds in value.items()})


def _names(value, pattern, key) -> tuple:
    _check(isinstance(value, list) and len(set(value)) == len(value), key)
    _check(all(isinstance(name, str) and pattern.fullmatch(name) for name in value), key)
    return tuple(value)


def _smoke(value) -> dict:
    """smoke: the pages deploy/smoke.py fetches (each must contain its text) and the optional extension."""
    _check(isinstance(value, dict) and set(value) <= {'pages', 'extension'}, 'smoke')
    pages = value.get('pages')
    _check(isinstance(pages, list) and len(pages) > 0, 'smoke.pages')
    for page in pages:
        _check(isinstance(page, dict) and set(page) == {'path', 'contains'}, 'smoke.pages')
        _check(isinstance(page['path'], str) and page['path'].startswith('/'), 'smoke.pages')
        _check(isinstance(page['contains'], str) and page['contains'] != '', 'smoke.pages')
    extension = value.get('extension')
    _check(extension is None or (isinstance(extension, str) and SMOKE_EXTENSION.fullmatch(extension) is not None
                                 and extension.split('/')[1] not in KIT_FILES), 'smoke.extension')
    return {'smoke_pages': tuple(dict(page) for page in pages), 'smoke_extension': extension}


def load(path: Path | None = None) -> Site:
    data = json.loads((path or DEFAULT_PATH).read_text(encoding='utf-8'))
    try:
        slug = data['slug']
        deploy = data['deploy']
        volumes = deploy['volumes']
        flags = {key: deploy[key] for key in ('quietWindow', 'wwwRedirect')}
        flags.update({key: deploy.get(key, False) for key in ('payments', 'email')})
        for key, value in flags.items():
            _check(isinstance(value, bool), f'deploy.{key}')
        site = Site(
            slug=slug,
            port=data['app']['port'],
            directory=Path(deploy['directory']),
            project=deploy['composeProject'],
            image_repository=deploy['imageRepository'],
            volume_owner_label=deploy['volumeOwnerLabel'],
            database_volume=volumes['database'],
            media_volume=volumes['media'],
            legacy_database_volume=volumes['legacyDatabase'],
            db_name=deploy['database']['name'],
            db_user=deploy['database']['user'],
            traefik_name=deploy['traefikName'],
            default_host=deploy['defaultHost'],
            protected_hosts=tuple(deploy['protectedHosts']),
            protected_health_url=deploy['protectedHealthUrl'],
            ops_jobs=_names(deploy['opsJobs'], SLUG, 'deploy.opsJobs'),
            required_secrets=_names(deploy.get('requiredSecrets', ['POSTGRES_PASSWORD']), SECRET_NAME, 'deploy.requiredSecrets'),
            optional_secrets=_names(deploy.get('optionalSecrets', []), SECRET_NAME, 'deploy.optionalSecrets'),
            payments=flags['payments'],
            email=flags['email'],
            quiet_window=flags['quietWindow'],
            www_redirect=flags['wwwRedirect'],
            timings=_timings(deploy.get('timings', {})),
            **_smoke(data.get('smoke')),
        )
    except (KeyError, TypeError) as error:
        raise ValueError(f'site.config.json : clé manquante {error}') from None
    _check(isinstance(slug, str) and SLUG.fullmatch(slug) is not None, 'slug')
    _check(isinstance(site.port, int) and 1024 <= site.port <= 65535, 'app.port')
    _check(str(site.directory) == f'/srv/{slug}', 'deploy.directory')
    _check(site.project == f'{slug}-prod', 'deploy.composeProject')
    _check(site.traefik_name == slug, 'deploy.traefikName')
    _check(IMAGE_REPOSITORY.fullmatch(site.image_repository) is not None, 'deploy.imageRepository')
    _check(OWNER_LABEL.fullmatch(site.volume_owner_label) is not None, 'deploy.volumeOwnerLabel')
    _check(isinstance(site.database_volume, str), 'deploy.volumes')
    for volume in (site.database_volume, site.media_volume, site.legacy_database_volume):
        _check(volume is None or volume.startswith(f'{site.project}-'), 'deploy.volumes')
    _check(bool(site.db_name) and bool(site.db_user), 'deploy.database')
    _check(site.default_host not in site.protected_hosts, 'deploy.defaultHost')
    _check(not set(site.ops_jobs) & set(RESERVED_SERVICES), 'deploy.opsJobs')
    # The kit builds DATABASE_URL from POSTGRES_PASSWORD; a secret name never shadows another input.
    _check('POSTGRES_PASSWORD' in site.required_secrets, 'deploy.requiredSecrets')
    others = set(BASE_INPUTS + REGISTRY_INPUTS + PAYMENT_INPUTS + EMAIL_INPUTS + BOOTSTRAP_INPUTS)
    _check(not set(site.required_secrets) & others, 'deploy.requiredSecrets')
    _check(not set(site.optional_secrets) & (others | set(site.required_secrets)), 'deploy.optionalSecrets')
    return site


def input_keys(site: Site) -> list:
    """Names dispatch.py sends to release.py, the only ones release.py accepts."""
    keys = [*BASE_INPUTS, *site.required_secrets, *site.optional_secrets]
    if site.payments:
        keys += PAYMENT_INPUTS
    if site.email:
        keys += EMAIL_INPUTS
    if BOOTSTRAP_JOB in site.ops_jobs:
        keys += BOOTSTRAP_INPUTS
    return keys + list(REGISTRY_INPUTS)


def compose_env(site: Site) -> dict:
    """Values docker-compose.prod.yml interpolates."""
    values = {
        'SITE_TRAEFIK_NAME': site.traefik_name,
        'SITE_PORT': str(site.port),
        'SITE_DB_NAME': site.db_name,
        'SITE_DB_USER': site.db_user,
        'SITE_VOLUME_DATABASE': site.database_volume,
    }
    # A site without media has no media volume in its compose file.
    if site.media_volume is not None:
        values['SITE_VOLUME_MEDIA'] = site.media_volume
    return values


def image_pattern(site: Site) -> re.Pattern:
    return re.compile(re.escape(site.image_repository) + r':[0-9a-f]{40}')


def release_name(script: Path, site: Site) -> str:
    """The release (commit) a deploy script runs from: <directory>/releases/<sha>/deploy/<file>."""
    parts = Path(script).parts
    if len(parts) < 4 or parts[-2] != 'deploy':
        raise RuntimeError('Chemin de release invalide.')
    release = Path(*parts[:-2])
    if release.parent != site.directory / 'releases' or not SHA.fullmatch(release.name):
        raise RuntimeError('Chemin de release invalide.')
    return release.name


def database_url(site: Site, password: str) -> str:
    return f'postgresql://{site.db_user}:{quote(password, safe="")}@postgres:5432/{site.db_name}'


def remote_values(site: Site) -> dict:
    """What a function sent over SSH needs to know about the site (JSON-serialisable)."""
    return {
        'directory': str(site.directory),
        'project': site.project,
        'db_name': site.db_name,
        'db_user': site.db_user,
        'media': site.media_volume is not None,
        'compose_env': compose_env(site),
    }


def public_host(env, site: Site) -> str:
    return env.get('TRAEFIK_HOST') or env.get('PRODUCTION_HOST') or site.default_host


if __name__ == '__main__':
    if sys.argv[1:] == ['host']:
        print(public_host(os.environ, load()))
    else:
        sys.exit('Usage : python3 deploy/site_config.py host')
