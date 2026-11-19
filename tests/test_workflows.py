"""GitHub workflows on the deploy kit's model (ported from manon-karsenti), deploy gated until the cutover."""
import importlib.util
from pathlib import Path
import re
import sys
import unittest

ROOT = Path(__file__).resolve().parents[1]
WORKFLOWS = sorted((ROOT / '.github' / 'workflows').glob('*.yml'))


def module(name):
    spec = importlib.util.spec_from_file_location(name, ROOT / 'deploy' / f'{name}.py')
    result = importlib.util.module_from_spec(spec)
    sys.modules[name] = result
    spec.loader.exec_module(result)
    return result


site_config = module('site_config')
SITE = site_config.load()


def workflow(name):
    return (ROOT / '.github' / 'workflows' / name).read_text(encoding='utf-8')


def job(text, name):
    match = re.search(rf'^  {name}:\n((?:(?:    .*)?\n)*)', text, re.M)
    assert match, name
    return match.group(1)


class WorkflowsTest(unittest.TestCase):
    def test_no_workflow_names_the_site(self):
        tokens = [SITE.slug, SITE.default_host, str(SITE.directory), '/srv/eau-robinet']
        for path in WORKFLOWS:
            text = path.read_text(encoding='utf-8').lower()
            for token in tokens:
                self.assertNotIn(token.lower(), text, f'{path.name}: {token}')

    def test_every_workflow_reaching_the_vps_shares_one_concurrency_group(self):
        for path in WORKFLOWS:
            text = path.read_text(encoding='utf-8')
            if 'SSH_HOST' in text:
                self.assertIn('group: ${{ github.repository }}-production', text, path.name)
                self.assertIn('cancel-in-progress: false', text, path.name)

    def test_the_deploy_job_validates_before_any_remote_write(self):
        text = workflow('deploy.yml')
        self.assertLess(text.index('deploy/preflight.py'), text.index('deploy/dispatch.py'))

    def test_the_deploy_job_provides_every_deploy_input(self):
        text = workflow('deploy.yml')
        deploy = text[text.index('\n  deploy:\n'):]
        for key in site_config.input_keys(SITE):
            self.assertRegex(deploy, rf'\n      {key}: \$\{{\{{', key)

    def test_production_jobs_stay_off_until_the_variable_is_set(self):
        deploy = job(workflow('deploy.yml'), 'deploy')
        self.assertIn("    if: github.ref == 'refs/heads/main' && vars.PRODUCTION_DEPLOY_ENABLED == 'true'\n", deploy)
        self.assertIn('    environment: production\n', deploy)
        self.assertIn("    if: vars.PRODUCTION_DEPLOY_ENABLED == 'true'\n", job(workflow('monitor.yml'), 'monitor'))

    def test_the_image_job_pushes_immutable_web_and_ops_tags_only(self):
        image = job(workflow('deploy.yml'), 'image')
        self.assertIn('target: production', image)
        self.assertIn('target: ops', image)
        self.assertIn(':${GITHUB_SHA}"', image)
        self.assertIn(':${GITHUB_SHA}-ops"', image)
        self.assertNotIn(':main', image)

    def test_the_old_deploy_script_is_gone(self):
        self.assertFalse((ROOT / 'deploy' / 'remote-deploy.sh').exists())
        self.assertFalse((ROOT / 'deploy' / 'test-remote-deploy.sh').exists())
        for path in WORKFLOWS:
            self.assertNotIn('remote-deploy', path.read_text(encoding='utf-8'), path.name)

    def test_ci_runs_the_python_tests_and_the_image_smoke(self):
        ci = workflow('ci.yml')
        self.assertIn("python3 -m unittest discover -s tests -p 'test_*.py'", job(ci, 'python'))
        container = job(ci, 'container')
        self.assertIn('target: production', container)
        self.assertIn('target: ops', container)
        self.assertIn('SMOKE_IMAGE: app:ci', container)
        self.assertIn('SMOKE_OPS_IMAGE: app:ci-ops', container)
        self.assertIn('run: python3 deploy/smoke.py', container)

    def test_ci_runs_the_browser_suite_on_the_production_build(self):
        browser = job(workflow('ci.yml'), 'browser')
        self.assertIn('pnpm install --frozen-lockfile', browser)
        self.assertIn('pnpm exec playwright install --with-deps chromium', browser)
        self.assertIn('run: pnpm test:e2e', browser)

    def test_the_artifact_backup_is_gone(self):
        # Off-site backups live in infra-traefik (restic to B2); every deploy still dumps the database.
        self.assertFalse((ROOT / '.github' / 'workflows' / 'backup.yml').exists())
        self.assertFalse((ROOT / 'deploy' / 'backup.py').exists())
        self.assertNotIn('backup.py', module('site_config').KIT_FILES)
        self.assertNotIn('BACKUP_ENCRYPTION_KEY', (ROOT / 'site.config.json').read_text(encoding='utf-8'))
        for path in WORKFLOWS:
            text = path.read_text(encoding='utf-8')
            self.assertNotIn('BACKUP_ENCRYPTION_KEY', text, path.name)
            self.assertNotIn('upload-artifact', text, path.name)

    def test_monitor_reads_this_site_health_shape(self):
        monitor = workflow('monitor.yml')
        self.assertIn('python3 deploy/site_config.py host', monitor)
        self.assertIn('.status == "ok" and .postgres == true and .schema == true', monitor)


if __name__ == '__main__':
    unittest.main()
