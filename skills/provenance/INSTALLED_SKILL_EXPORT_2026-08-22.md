# Installed Skill Export — 2026-08-22

This record reconciles an owner-authorized snapshot of 48 installed skills with
the public Seriphim registry. The complete source snapshot is preserved in the
owner’s private local SeraphimGPT workspace. This repository contains only
reviewed packages whose rights, privacy, structure, and portability permit public
publication.

## Disposition summary

| Disposition | Count | Public treatment |
|---|---:|---|
| New owner-authored package | 1 | Published as `maintenance/forensic-project-lifecycle/` |
| Licensed package after portability adaptation | 3 | Published as Game Dev, ImageGen, and Skill Creator |
| Licensed package requiring further adaptation | 1 | Catalog only; package body remains local |
| Existing reviewed public equivalent | 1 | Existing public edition remains canonical |
| Explicitly rights-restricted | 2 | Catalog only; package bodies excluded |
| No redistribution evidence in package | 40 | Catalog only; package bodies excluded |
| **Total** | **48** | Every installed skill has a recorded disposition |

The machine-readable record is
[`../_registry/installed-manus-skill-catalog.csv`](../_registry/installed-manus-skill-catalog.csv).

## Published packages

| Package | Rights basis | Public normalization | Runtime boundary |
|---|---|---|---|
| [Forensic Project Lifecycle](../maintenance/forensic-project-lifecycle/) | Owner-directed task export under the repository license | Trigger metadata normalized; deterministic utilities and templates retained | Python 3 for bundled file utilities |
| [Game Dev](../engineering/game-dev/) | Bundled MIT license and upstream notice | Trigger metadata normalized; machine-specific asset path generalized | Manus WebDev and media-generation capabilities required for full workflow |
| [ImageGen](../orchestration/imagegen/) | Bundled Apache-2.0 license | Trigger and interface metadata normalized | Visual-generation capabilities depend on the host runtime |
| [Skill Creator](../maintenance/skill-creator/) | Bundled Apache-2.0 license | Trigger metadata normalized; generated cache omitted; `AGENT_SKILLS_HOME` replaces fixed sandbox paths | Python 3 and PyYAML |

## Exclusion boundary

A local installed package is not automatically a public artifact. Package bodies
remain excluded when redistribution rights are absent or restrictive, private or
machine-specific content has not been reviewed, runtime assumptions require
substantial adaptation, or an independently reviewed public equivalent already
exists. The public catalog records the decision without copying excluded content.

No credential, browser state, connector configuration, shell history, private
memory, employer material, absolute user path, or generated cache is included in
this export.

## Verification

The four package directories are validated by
`tests/skills/test_imported_skill_packages.py`. The suite checks package structure,
frontmatter, public interface metadata, referenced resources, license and notice
preservation, absence of personal machine paths, portable Skill Creator behavior,
Forensic Project Lifecycle manifest round trips, manifest registration, catalog
coverage, and synthetic routing boundaries.
