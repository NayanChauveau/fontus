"""The deploy kit is byte-identical in every site: deploy/KIT.sha256 lists its files and their hashes.

The same list is committed in every site made from the kit; a kit change is made once, copied to
every site, and the list updated with: (cd deploy && shasum -a 256 <files> > KIT.sha256).
"""
import hashlib
from pathlib import Path
import sys
import unittest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'deploy'))
import site_config  # noqa: E402


def listed():
    entries = {}
    for line in (ROOT / 'deploy' / 'KIT.sha256').read_text(encoding='utf-8').splitlines():
        digest, name = line.split('  ', 1)
        entries[name] = digest
    return entries


class KitParityTest(unittest.TestCase):
    def test_the_list_names_exactly_the_kit_files(self):
        self.assertEqual(sorted(listed()), sorted(site_config.KIT_FILES))

    def test_every_kit_file_matches_its_hash(self):
        for name, digest in listed().items():
            with self.subTest(file=name):
                self.assertEqual(hashlib.sha256((ROOT / 'deploy' / name).read_bytes()).hexdigest(), digest)


if __name__ == '__main__':
    unittest.main()
