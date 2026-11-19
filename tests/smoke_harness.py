"""Runs deploy/smoke.py against a recorded Docker and HTTP double (no container is started).

`docker compose config` is the real one (the rendered compose file is part of what is checked);
every other compose call and every HTTP request is recorded and answered with canned data.
Random values (project id, passwords, TOTP time) are fixed, so a trace is deterministic.
Shared by tests/test_smoke_plan.py; identical in every site made from the kit.
"""
import contextlib
import email.message
import hashlib
import importlib.util
import io
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import urllib.error
import uuid
from unittest import mock

ROOT = Path(__file__).resolve().parents[1]
DEPLOY = ROOT / 'deploy'
PNG = b'\x89PNG smoke'
ASSET = '/_next/static/chunks/app.js'


def docker_available():
    return shutil.which('docker') is not None and subprocess.run(
        ['docker', 'compose', 'version'], capture_output=True).returncode == 0


def digest(data):
    return None if data is None else hashlib.sha256(data).hexdigest()[:16]


class Response:
    def __init__(self, body, cookies=()):
        self.body = body
        self.headers = email.message.Message()
        for value in cookies:
            self.headers['Set-Cookie'] = value

    def read(self):
        return self.body

    def __enter__(self):
        return self

    def __exit__(self, *args):
        return False


class Double:
    """Answers smoke.py's compose calls and HTTP requests; records them in `trace`."""

    def __init__(self, pages=()):
        self.trace = []
        self.compose_file = None
        # Every page answers with all expected texts and one build asset.
        self.page = ' '.join([*(page['contains'] for page in pages), 'Le site ouvre très bientôt',
                              'Titre persistant CI', f'<script src="{ASSET}"></script>']).encode()
        self.real_run = subprocess.run

    def run(self, args, check=False, capture_output=False, input=None, **kwargs):
        args = list(args)
        assert args[:2] == ['docker', 'compose'], args
        file = args[args.index('-f') + 1]
        command = args[args.index('-f') + 2:]
        if self.compose_file is None:
            self.compose_file = json.loads(Path(file).read_text())
        self.trace.append({'compose': command, 'input': digest(input)})
        code, stdout, stderr = 0, b'', b''
        if command[0] == 'port':
            stdout = b'127.0.0.1:49999\n'
        elif command[:4] == ['exec', '-T', 'web', 'id']:
            stdout = b'1001\n'
        elif command[:4] == ['exec', '-T', 'web', 'node']:
            stdout = PNG
        elif command[:4] == ['exec', '-T', 'postgres', 'pg_dump']:
            stdout = b'PGDMP smoke'
        elif command[-1] == 'media-backup':
            stdout = bytes([31, 139]) + b' smoke'
        elif command[-1] == 'email-test':
            code, stderr = 1, 'Destinataire invalide.'.encode()
        if check and code:
            raise subprocess.CalledProcessError(code, args)
        return subprocess.CompletedProcess(args, code, stdout, stderr)

    def check_output(self, args, **kwargs):
        self.trace.append({'render': list(args[args.index('-f'):])})
        # Popen, not check_output: subprocess.run (used by check_output) is the double here.
        with subprocess.Popen(args, cwd=ROOT, stdout=subprocess.PIPE, env=kwargs.get('env')) as process:
            stdout = process.stdout.read()
        if process.returncode:
            raise subprocess.CalledProcessError(process.returncode, args)
        return stdout

    def urlopen(self, request, timeout=None):
        path = request.full_url.split('49999', 1)[1]
        self.trace.append({'request': path, 'method': request.get_method(), 'body': digest(request.data),
                           'type': request.get_header('Content-type'), 'cookie': request.get_header('Cookie')})
        if path.startswith('/_next/static/'):
            return Response(b'asset')
        answers = {
            '/site-icon.svg': Response(b'<svg/>'),
            '/admin/login': Response(b'<html>'),
            '/api/users/login': Response(b'{}', ['payload-token=token; Path=/; Secure']),
            '/api/setup-totp': Response(b'{"ok": true}', ['payload-totp=second; Path=/; Secure']),
            '/api/media': Response(json.dumps({'doc': {'id': 1, 'filename': 'smoke.png'}}).encode()),
            '/api/media/file/smoke.png': Response(PNG),
            '/api/health': Response(b'{"status": "ok"}'),
        }
        if path == '/api/globals/commerce-settings':
            raise urllib.error.HTTPError(request.full_url, 403, 'Forbidden', email.message.Message(), None)
        if path in answers:
            return answers[path]
        return Response(b'{}' if path.startswith('/api/') else self.page)


def load_smoke(path=DEPLOY / 'smoke.py'):
    sys.path.insert(0, str(DEPLOY))
    spec = importlib.util.spec_from_file_location('smoke_under_test', path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def trace(path=DEPLOY / 'smoke.py', pages=()):
    """Runs smoke.main() against the double; returns (trace, compose file, printed text)."""
    double = Double(pages)
    output = io.StringIO()
    environment = {key: value for key, value in os.environ.items() if not key.startswith('SMOKE_')}
    previous = os.getcwd()
    os.chdir(ROOT)
    try:
        with mock.patch.dict(os.environ, environment, clear=True), \
                mock.patch('subprocess.run', double.run), \
                mock.patch('subprocess.check_output', double.check_output), \
                mock.patch('urllib.request.urlopen', double.urlopen), \
                mock.patch('uuid.uuid4', lambda: uuid.UUID(int=0)), \
                mock.patch('secrets.token_hex', lambda size=32: 'a' * 2 * size), \
                mock.patch('secrets.token_bytes', lambda size=32: b'\x01' * size), \
                mock.patch('time.time', lambda: 1_800_000_000.0), \
                contextlib.redirect_stdout(output):
            load_smoke(path).main()
    finally:
        os.chdir(previous)
    return double.trace, double.compose_file, output.getvalue()
