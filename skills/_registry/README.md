# Skill Registry

This directory governs the canonical Seraphim/EiRAM skill collection without
making historical or imported packages discoverable as active skills.

## Authority

- `capability-manifest.json` remains the machine-readable capability authority.
- `live-skill-inventory.csv` records the 27 active Git-tracked packages.
- `archive-skill-inventory.csv` records 79 entries found inside historical
  exports and the MANUS harvest.
- `artifact-checksums.csv` records the eleven preserved binary artifacts.
- `migration-map.csv` records the disposition of duplicate roots and archives.

The binary archives are intentionally preserved outside this public repository
under `SeraphimGPT\archive\skill-consolidation-2026-08-18`. Publishing
unaudited archives here would violate the repository's public-exposure policy.

## Discovery boundary

Only functional category directories may contain active `SKILL.md` files.
Directories beginning with an underscore contain governance records or pointers
only. Candidate packages must remain compressed or use a disabled filename such
as `SKILL.candidate.md` until provenance, licensing, security, compatibility,
and behavior tests pass.

The separate `Development\GitHub\Seriphim` directory remains a complete Git
checkout and is excluded from active discovery. It must be reconciled as a
repository, not by deleting its skills subdirectory.
