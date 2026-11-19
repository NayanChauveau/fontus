"""Daily CI backup: existing SSH transport, pg_dump, tar and standard GnuPG."""
import inspect
import json
import os
from pathlib import Path
import re
import subprocess
import tempfile

from ssh_connection import connection
import site_config


def snapshot(site):
    # Runs on the VPS via CI; stdout contains only the archive.
    import json
    import os
    from pathlib import Path
    import subprocess
    import sys
    import tarfile
    import tempfile

    site = json.loads(site)
    base = Path(site['directory'])
    current = json.loads((base / 'current.json').read_text())
    runtime = json.loads((base / 'runtime.json').read_text())
    release = base / 'releases' / current['sha']
    if release.resolve().parent != base / 'releases':
        raise ValueError('Release invalide.')
    compose = ['docker', 'compose', '--env-file', '/dev/null', '-p', site['project'], '-f', str(release / 'docker-compose.prod.yml')]
    env = {**os.environ, **runtime, **site['compose_env']}

    def run(*args, **kwargs):
        return subprocess.run([*compose, *args], env=env, check=True, **kwargs)

    container = run('ps', '-q', 'web', capture_output=True, text=True).stdout.strip()
    if not container:
        raise RuntimeError('Web arrêté : sauvegarde annulée sans démarrage implicite.')
    with tempfile.TemporaryDirectory(prefix='backup-', dir=base) as temporary:
        folder = Path(temporary)
        try:
            run('stop', 'web', stdout=sys.stderr)
            with (folder / 'database.dump').open('wb') as output:
                run('exec', '-T', 'postgres', 'pg_dump', '-U', site['db_user'], '-d', site['db_name'], '-Fc', stdout=output)
            # A site without media (deploy.volumes.media null) has no media archive.
            if site['media']:
                with (folder / 'media.tar.gz').open('wb') as output:
                    run('run', '--rm', '-T', '--no-deps', 'media-backup', stdout=output)
        finally:
            run('start', 'web', stdout=sys.stderr)
        with tarfile.open(fileobj=sys.stdout.buffer, mode='w|gz') as archive:
            for name in ['database.dump', *(['media.tar.gz'] if site['media'] else [])]:
                archive.add(folder / name, arcname=name)
            archive.add(base / 'runtime.json', arcname='runtime.json')
            archive.add(base / 'current.json', arcname='current.json')
            archive.add(release / 'docker-compose.prod.yml', arcname='docker-compose.prod.yml')


def remote_program():
    """Python sent over SSH stdin; the site values are a JSON literal."""
    site = json.dumps(site_config.remote_values(site_config.load()))
    return inspect.getsource(snapshot) + f'\nsnapshot({site!r})\n'


def encrypt(source, target, home):
    key = os.environ.get('BACKUP_ENCRYPTION_KEY', '')
    if not re.fullmatch(r'[0-9a-fA-F]{64}', key):
        raise ValueError('BACKUP_ENCRYPTION_KEY doit contenir 64 caractères hexadécimaux.')
    common = ['gpg', '--homedir', str(home), '--batch', '--yes', '--pinentry-mode', 'loopback', '--passphrase-fd', '0']
    subprocess.run([*common, '--symmetric', '--cipher-algo', 'AES256', '--output', str(target), str(source)], input=key.encode(), check=True)
    # Verify decryption and integrity without writing another plaintext copy.
    subprocess.run([*common, '--decrypt', '--output', os.devnull, str(target)], input=key.encode(), check=True)


def main():
    if os.environ.get('GITHUB_ACTIONS') != 'true' or os.environ.get('GITHUB_REF') != 'refs/heads/main':
        raise RuntimeError('Sauvegarde autorisée uniquement depuis la CI de main.')
    if not re.fullmatch(r'[0-9a-fA-F]{64}', os.environ.get('BACKUP_ENCRYPTION_KEY', '')):
        raise ValueError('Configurer BACKUP_ENCRYPTION_KEY avant de lancer la sauvegarde.')
    output = Path('backup-output')
    output.mkdir(mode=0o700, exist_ok=True)
    os.umask(0o077)
    with tempfile.TemporaryDirectory() as temporary:
        folder = Path(temporary)
        with connection() as execute, (folder / 'snapshot.tar.gz').open('wb') as archive:
            execute('umask 077; python3 -', input=remote_program().encode(), stdout=archive)
        encrypt(folder / 'snapshot.tar.gz', output / 'snapshot.tar.gz.gpg', folder)
    print('Sauvegarde chiffrée et déchiffrement vérifié ; aucun fichier en clair publié.')


if __name__ == '__main__':
    main()
