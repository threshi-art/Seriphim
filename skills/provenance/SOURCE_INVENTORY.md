# Public Skill Source Inventory

This inventory records the provenance class used to prepare public Skill
packages. Private filenames, archive fingerprints, account identifiers, and
source locations are intentionally not published.

## Verified authoritative exports

| Public package | Provenance class | Public treatment |
|---|---|---|
| Breadcrumb Investigator | Owner-supplied authoritative export | Reviewed text package |
| Ei R@M Investigative Orchestrator | Owner-supplied authoritative export | Reviewed text package |
| EiRAM Editorial Intelligence | Owner-supplied authoritative export | Reviewed text package with non-redistributable media omitted |
| YouTube Ei R@M Ingest | Owner-supplied authoritative export | Reviewed text package with non-redistributable media omitted |

## Normalization record

All four exports were unpacked as reviewed text rather than committed as ZIP
files. Their `SKILL.md` descriptions were normalized to portable `Use when...`
trigger statements.

- EiRAM Editorial Intelligence: removed identity-linked personal voice wording;
  omitted an icon with unverified redistribution provenance; normalized public
  interface metadata.
- YouTube Ei R@M Ingest: omitted an icon with unverified redistribution
  provenance; normalized public interface metadata; retained the prohibition on
  bypassing sign-in, private, members-only, age, and regional restrictions.
- Breadcrumb Investigator and Ei R@M Investigative Orchestrator: preserved the
  reviewed evidence and routing references while normalizing trigger metadata.

Possession of an export does not grant authority to publish personal memory,
Agent configuration, account identifiers, credentials, or unrelated project
files. Those materials remain excluded regardless of source location.

## Validation scope

The packages are checked by `tests/skills/test_public_skill_packages.py` and the
platform Skill validator. Synthetic routing fixtures record reviewed expected
outcomes, but do not claim live independent-agent evaluation.

## Reconstructed public editions

The following packages were reconstructed from the public routing architecture,
handoff contract, capability registry, synthetic regression cases, and approved
collection design. They are not represented as historical exports:

- Context Sentinel;
- Semantic Priority Router;
- Seraphim Operator Routing;
- Seraphim Action Controller;
- Skill Ecosystem Governor.

The same reconstruction standard applies to the specialized public editions:

- Lawful HUMINT Collection Planner;
- Seraphim Decision Laboratory;
- Seraphim Legal Intelligence;
- Repo Surgeon;
- Workspace Auditor.

The reconstruction preserves functional boundaries, routing states, handoff
fields, correction precedence, external-effect states, and audit categories.
It contains no private Agent prompt, personal memory, credential, installed
Skill ID, or claim of unavailable runtime integration. Deterministic fixtures
record reviewed expected outcomes but are not live independent-agent testing.

The specialized editions add consent, non-deception, jurisdiction, authority
hierarchy, decision ownership, exact-target, user-work preservation, and
read-only audit boundaries without reproducing private case material.
