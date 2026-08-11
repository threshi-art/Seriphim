import os
import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
PLATFORM = ROOT / "seraphim-platform"
TEXT_SUFFIXES = {".bat", ".json", ".md", ".ps1", ".py", ".ts", ".tsx", ".yaml", ".yml"}
IGNORED_PARTS = {".git", ".pnpm-store", "node_modules"}


class RepositoryHygieneTests(unittest.TestCase):
    def test_dashboard_pages_have_one_canonical_location(self):
        pages = PLATFORM / "client" / "src" / "pages"
        dashboard = pages / "dashboard"
        duplicates = [path.name for path in pages.glob("*.tsx") if (dashboard / path.name).exists()]
        self.assertEqual([], duplicates)

    def test_packaged_repository_docs_are_generated_not_tracked(self):
        generated = (
            PLATFORM
            / "desktop"
            / "SeraphimDesktopCompanion"
            / "wwwroot"
            / "repo-docs"
        )
        self.assertFalse(any(path.is_file() for path in generated.rglob("*")))

    def test_portfolio_projects_inherit_shared_policy_files(self):
        portfolio = ROOT / "app-portfolio"
        repeated = []
        for project in portfolio.iterdir():
            if not project.is_dir():
                continue
            for name in ("AGENTS.md", "ACADEMIC_AND_DESIGN_STANDARDS.md"):
                if (project / name).exists():
                    repeated.append(str((project / name).relative_to(ROOT)))
        self.assertEqual([], repeated)

    def test_public_text_has_no_user_specific_absolute_paths(self):
        windows_user_path = re.compile(r"[A-Za-z]:\\Users\\", re.IGNORECASE)
        offenders = []
        for directory, names, files in os.walk(ROOT):
            names[:] = [name for name in names if name not in IGNORED_PARTS]
            for name in files:
                path = Path(directory) / name
                if path.suffix.lower() not in TEXT_SUFFIXES:
                    continue
                text = path.read_text(encoding="utf-8", errors="ignore")
                if windows_user_path.search(text):
                    offenders.append(str(path.relative_to(ROOT)))
        self.assertEqual([], offenders)


if __name__ == "__main__":
    unittest.main()
