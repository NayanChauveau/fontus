#!/usr/bin/env python3
"""Runner-side deployment transport. No remote Git checkout and no shell secrets."""
import io
import json
import os
from pathlib import Path
import re
import shlex
import stat
import tarfile
from ssh_connection import connection
import site_config

SITE = site_config.load()
# Everything release.py needs on the VPS: it reads the site configuration next to itself. The
# archive holds exactly these regular files (allow-list) and the deploy input.
BUNDLE = ['docker-compose.prod.yml', 'deploy/release.py', 'deploy/site_config.py', 'site.config.json']
# A release that outlives this is cut: the job then fails instead of hanging until its own limit.
REMOTE_TIMEOUT_SECONDS = 900


def archive(root, payload, files=BUNDLE):
    """The release archive: allow-listed regular files of `root`, then deploy-input.json (mode 600).

    A symlink, a directory or a path outside the allow-list is refused before anything is sent.
    """
    bundle = io.BytesIO()
    with tarfile.open(fileobj=bundle, mode='w:gz') as tar:
        for file in files:
            if file not in BUNDLE:
                raise ValueError('Fichier hors de la liste autorisée du déploiement.')
            if not stat.S_ISREG(os.lstat(Path(root) / file).st_mode):
                raise ValueError('Fichier de déploiement qui n’est pas un fichier ordinaire.')
            tar.add(Path(root) / file, arcname=file, recursive=False)
        info = tarfile.TarInfo('deploy-input.json')
        info.size = len(payload)
        info.mode = 0o600
        tar.addfile(info, io.BytesIO(payload))
    return bundle.getvalue()


def main():
    if os.environ.get('GITHUB_REF') != 'refs/heads/main' or os.environ.get('GITHUB_ACTIONS') != 'true':
        raise RuntimeError('Déploiement autorisé uniquement depuis la CI de main.')
    sha = os.environ['GITHUB_SHA']
    if not re.fullmatch('[0-9a-f]{40}', sha):
        raise ValueError('SHA invalide.')
    with connection() as execute:
        inputs = {key: os.environ.get(key, '') for key in site_config.input_keys(SITE)}
        inputs['TRAEFIK_HOST'] = site_config.public_host(os.environ, SITE)
        bundle = archive('.', json.dumps(inputs).encode())
        directory = f'{SITE.directory}/releases/{sha}'
        # Only validated paths enter the command; secrets travel as tar stdin bytes. A dropped SSH
        # session must not stop the release halfway: the remote shell ignores SIGPIPE and SIGHUP.
        command = f"trap '' PIPE HUP; umask 077; mkdir -p {shlex.quote(directory)} && trap {shlex.quote('rm -f ' + directory + '/deploy-input.json')} EXIT; tar -xzf - -C {shlex.quote(directory)} && python3 {shlex.quote(directory + '/deploy/release.py')}"
        execute(command, input=bundle, timeout=REMOTE_TIMEOUT_SECONDS)


if __name__ == '__main__':
    main()
