# Public Skill Source Inventory

This inventory records the private source archives used to prepare public Skill
packages. The archives themselves are intentionally not committed.

## Verified authoritative exports

| Public package | Private archive | SHA-256 |
|---|---|---|
| Breadcrumb Investigator | `breadcrumb_skill.zip` | `C8F3F000ECA50E2D7223F32111399E91903C00A5E860418423FE21D21F6B2EA8` |
| Ei R@M Investigative Orchestrator | `eiram_datacollect_skill.zip` | `FE877746112AC015932135916031B5A3D91C818D122BD246760A68E5B003E14B` |
| EiRAM Editorial Intelligence | `eiram-editorial-intelligence.zip` | `C7A835EA90CAB98B78CE4DAFA7F871A5E72E7A2DA2B382120EECF58AE964A114` |
| YouTube Ei R@M Ingest | `skill(7)youtube.zip` | `6DFDE41D38A3BFF3BF0F3274768229B91C7D4712948F90BF4F92E4B10A5D09AA` |

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

No private archive contains authority to publish personal memory, Agent
configuration, account identifiers, credentials, or unrelated project files.
Those materials remain excluded regardless of archive location.

## Validation scope

The packages are checked by `tests/skills/test_public_skill_packages.py` and the
platform Skill validator. Synthetic routing fixtures record reviewed expected
outcomes, but do not claim live independent-agent evaluation.
