# Seraphim Skills

This directory is the public registry for Seraphim/EiRAM capabilities.

At present, `capability-manifest.json` records specifications recovered from
project history. It does **not** contain installable public Skill packages. A
historical conversation saying that a Skill was created, installed, or tested
is design evidence—not a substitute for reviewing the current package body.

## Publication Gate

Before a package is added here:

1. export the authoritative current version;
2. remove personal memory, private names, credentials, IDs, and local paths;
3. verify that every claimed tool and integration is actually available;
4. review bundled references and assets for redistribution rights;
5. run structural validation and synthetic behavior tests;
6. document triggers, exclusions, inputs, outputs, and handoff behavior;
7. change the manifest status only with review evidence.

## Planned Families

```text
skills/
  orchestration/
  investigation/
  analysis/
  editorial/
  legal/
  decision-support/
  media-ingest/
```

Personal writing style, memory, relationships, and private Agent configuration
remain outside the public repository.

See `recovery/RECOVERY_MANIFEST.md` for the ranked recovery queue and its
publication requirements.
