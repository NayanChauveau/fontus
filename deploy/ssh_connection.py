"""Shared runner-side SSH transport; credentials never enter command arguments."""
from contextlib import contextmanager
import os
from pathlib import Path
import re
import subprocess
import tempfile


@contextmanager
def connection():
    host, user = os.environ['SSH_HOST'], os.environ['SSH_USER']
    port = os.environ.get('SSH_PORT') or '22'
    if not re.fullmatch('[a-zA-Z0-9_.-]+', host) or not re.fullmatch('[a-zA-Z0-9_-]+', user) or not port.isdigit():
        raise ValueError('Paramètres SSH invalides.')
    with tempfile.TemporaryDirectory() as temporary:
        temp = Path(temporary)
        known_hosts = temp / 'known_hosts'
        known_hosts.write_text(os.environ['SSH_KNOWN_HOSTS'])
        known_hosts.chmod(0o600)
        askpass = temp / 'askpass'
        askpass.write_text('#!/bin/sh\ncase "$1" in *passphrase*) printf "%s\\n" "$SSH_PASSPHRASE" ;; *) printf "%s\\n" "$SSH_PASSWORD" ;; esac\n')
        askpass.chmod(0o700)
        env = {**os.environ, 'SSH_ASKPASS': str(askpass), 'SSH_ASKPASS_REQUIRE': 'force', 'DISPLAY': ':0'}
        options = ['-o', 'StrictHostKeyChecking=yes', '-o', f'UserKnownHostsFile={known_hosts}', '-o', 'ConnectTimeout=10', '-o', 'ServerAliveInterval=15', '-o', 'NumberOfPasswordPrompts=1']
        if os.environ.get('SSH_KEY'):
            key = temp / 'identity'
            key.write_text(os.environ['SSH_KEY'] + '\n')
            key.chmod(0o600)
            options += ['-i', str(key), '-o', 'IdentitiesOnly=yes']
        elif not os.environ.get('SSH_PASSWORD'):
            raise ValueError('SSH_KEY ou SSH_PASSWORD requis.')

        def execute(command, **kwargs):
            return subprocess.run(['ssh', *options, '-p', port, f'{user}@{host}', command], env=env, check=True, **kwargs)
        yield execute
