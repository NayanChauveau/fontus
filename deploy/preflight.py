#!/usr/bin/env python3
"""Validate CI settings before remote writes."""
import os
import re
from release import runtime_config
import site_config


def check_repository(env, site):
    """A copied repository still pointing at another site's image is refused before any write."""
    if 'ghcr.io/' + env.get('GITHUB_REPOSITORY', '').lower() != site.image_repository:
        raise ValueError('Dépôt GitHub différent de imageRepository dans site.config.json.')


def main():
    site = site_config.load()
    check_repository(os.environ, site)
    required = ['SSH_HOST', 'SSH_USER', 'SSH_KNOWN_HOSTS', 'GHCR_USER', 'GHCR_TOKEN']
    missing = [key for key in required if not os.environ.get(key)]
    if missing:
        raise ValueError('Paramètres GitHub manquants : ' + ', '.join(missing))
    if not os.environ.get('SSH_KEY') and not os.environ.get('SSH_PASSWORD'):
        raise ValueError('Configurer SSH_KEY ou SSH_PASSWORD.')
    if not re.fullmatch(r'[a-zA-Z0-9_.-]+', os.environ['SSH_HOST']) or not re.fullmatch(r'[a-zA-Z0-9_-]+', os.environ['SSH_USER']):
        raise ValueError('Hôte ou utilisateur SSH invalide.')
    if not (os.environ.get('SSH_PORT') or '22').isdigit():
        raise ValueError('Port SSH invalide.')
    # Also refuses any deploy input holding a line break (named, never printed).
    config = runtime_config({**os.environ, 'TRAEFIK_HOST': site_config.public_host(os.environ, site)})
    if site.payments:
        mode = config['STRIPE_MODE']
        configured = bool(config[f'STRIPE_{mode.upper()}_SECRET_KEY'])
        print(f'Stripe : mode {mode}, ' + ('paire de secrets configurée.' if configured else f'paiement désactivé : STRIPE_{mode.upper()}_SECRET_KEY et STRIPE_{mode.upper()}_WEBHOOK_SECRET absents.'))
    if site_config.BOOTSTRAP_JOB in site.ops_jobs:
        bootstrap = [bool(os.environ.get(key)) for key in site_config.BOOTSTRAP_INPUTS]
        if any(bootstrap) and not all(bootstrap):
            raise ValueError('Configurer les trois secrets BOOTSTRAP_ADMIN_* ensemble.')
    print('Paramètres présents et valides ; aucune écriture effectuée.')


if __name__ == '__main__':
    main()
