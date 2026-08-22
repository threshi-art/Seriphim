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

The packages are checked by the `tests/skills/test_public_*.py` suites and the
platform Skill validator. Synthetic routing fixtures record reviewed expected
outcomes, but do not claim live independent-agent evaluation.

## Reviewed live-agent exports

These packages were exported from the owner's current Seraphim Core skill
attachments and reviewed as text before publication:

| Public package | Provenance class | Public treatment |
|---|---|---|
| Seraphim Mission Intake | Owner-supplied live export | Trigger normalized; private-capability dependency made conditional |
| Seraphim Evaluation Harness | Owner-supplied live export | Bytecode omitted; synthetic destinations neutralized |
| Software Architect | Owner-supplied live export | Trigger and interface metadata normalized |
| Technical Project Manager | Owner-supplied live export | Trigger metadata normalized |
| AI Solutions Engineer | Owner-supplied live export | Trigger metadata normalized |
| Technical Lead | Owner-supplied live export | Trigger metadata normalized |
| Cybersecurity Specialist | Owner-supplied live export | Trigger metadata normalized; defensive authorization boundary preserved |

The public packages contain no installed Skill IDs, Agent configuration, memory,
account identifiers, or private source material. The Evaluation Harness omits
generated Python bytecode and retains only source, rubric, configuration, and
synthetic fixtures.

## Owner-directed and licensed imports

Four additional packages were selected from an owner-authorized snapshot of 48
installed skills after license, portability, privacy, dependency, and structural
review:

| Public package | Provenance class | Public treatment |
|---|---|---|
| Forensic Project Lifecycle | Owner-authored task export | Trigger normalized; complete deterministic utilities and templates retained under the repository license |
| Game Dev | MIT-licensed upstream adaptation | License and notice preserved; one machine-specific asset path generalized; Manus WebDev dependency stated explicitly |
| ImageGen | Apache-2.0 licensed runtime export | License preserved; trigger and public interface metadata normalized |
| Skill Creator | Apache-2.0 licensed runtime export | License preserved; generated `.DS_Store` omitted; fixed sandbox paths replaced by the portable `AGENT_SKILLS_HOME` contract |

The complete 48-skill snapshot is preserved only in the owner’s private local
workspace. `_registry/installed-manus-skill-catalog.csv` records every name and
disposition without reproducing excluded bodies. One licensed package remains
deferred for substantial portability work, one capability already has an
independently reviewed public edition, two packages explicitly reserve all
rights, and forty packages have no bundled redistribution evidence. Those
forty-four package bodies are not published by this change.

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
- Workspace Auditor;
- Seraphim Publication Curator.

The reconstruction preserves functional boundaries, routing states, handoff
fields, correction precedence, external-effect states, and audit categories.
It contains no private Agent prompt, personal memory, credential, installed
Skill ID, or claim of unavailable runtime integration. Deterministic fixtures
record reviewed expected outcomes but are not live independent-agent testing.

The specialized editions add consent, non-deception, jurisdiction, authority
hierarchy, decision ownership, exact-target, user-work preservation, and
read-only audit boundaries without reproducing private case material.
The Publication Curator additionally preserves the six-disposition publication
taxonomy, canonical-record reconciliation, and exact-head landing boundary.
