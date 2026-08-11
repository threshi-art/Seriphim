# Seraphim Skills

This directory is the public registry for Seraphim/EiRAM capabilities.

`capability-manifest.json` is the canonical machine-readable inventory. Entries
marked `packaged` have reviewed package contents in this directory; entries
marked `specified` remain architecture records rather than installable Skills.
A historical conversation saying that a Skill was created, installed, or
tested is design evidence—not a substitute for reviewing the package body.

## Published packages

| Skill | Role | Package |
|---|---|---|
| Breadcrumb Investigator | Evidence supplier | `investigation/breadcrumb-investigator/` |
| Ei R@M Investigative Orchestrator | Analytical owner | `analysis/eiram-investigative-orchestrator/` |
| EiRAM Editorial Intelligence | Editorial owner | `editorial/eiram-editorial-intelligence/` |
| YouTube Ei R@M Ingest | Media evidence supplier | `media-ingest/youtube-eiram-ingest/` |

Each directory is the installable package root. Copy only the selected package
directory into a compatible Skills location; do not copy the category wrapper.
Tool availability remains environment-dependent, and a package does not grant
access to private sources or restricted services.

See `provenance/SOURCE_INVENTORY.md` for source digests, normalizations, and
intentional omissions.

## Publication Gate

Before a package is added here:

1. export the authoritative current version;
2. remove personal memory, private names, credentials, IDs, and local paths;
3. verify that every claimed tool and integration is actually available;
4. review bundled references and assets for redistribution rights;
5. run structural validation and synthetic behavior tests;
6. document triggers, exclusions, inputs, outputs, and handoff behavior;
7. change the manifest status only with review evidence.

## Collection layout

```text
skills/
  investigation/
  analysis/
  editorial/
  media-ingest/
  provenance/
```

Personal writing style, memory, relationships, and private Agent configuration
remain outside the public repository. Reconstructed orchestration and
specialized public editions will be reviewed in later pull requests; they are
not implied by this release.

See `recovery/RECOVERY_MANIFEST.md` for the ranked recovery queue and its
publication requirements.
