# Skill Registry

This directory governs the canonical Seraphim/EiRAM skill collection without
making historical or imported packages discoverable as active skills.

## Authority

- `capability-manifest.json` remains the machine-readable capability authority.
- `live-skill-inventory.csv` records the 30 active Git-tracked packages.
- `installed-manus-skill-catalog.csv` records the public disposition of all 48
  packages in the owner-authorized private local snapshot; it does not publish
  excluded package bodies.
- `archive-skill-inventory.csv` records 79 entries found inside historical
  exports and the MANUS harvest.
- `artifact-checksums.csv` records the eleven preserved binary artifacts.
- `migration-map.csv` records the disposition of duplicate roots and archives.

The binary archives and complete installed-skills snapshot are intentionally
preserved outside this public repository under the owner’s local `SeraphimGPT`
workspace. Publishing unaudited archives or packages without redistribution
evidence would violate the repository's public-exposure policy.

## Discovery boundary

Only functional category directories may contain active `SKILL.md` files.
Directories beginning with an underscore contain governance records or pointers
only. Candidate packages must remain compressed or use a disabled filename such
as `SKILL.candidate.md` until provenance, licensing, security, compatibility,
and behavior tests pass.

The separate `Development\GitHub\Seriphim` directory remains a complete Git
checkout and is excluded from active discovery. It must be reconciled as a
repository, not by deleting its skills subdirectory.

## Imported package fingerprints

For packages added on or after 2026-08-22, `tree_sha256` is computed by sorting
regular files by package-relative POSIX path and hashing, for each file, the UTF-8
path, a NUL delimiter, decimal byte count, a NUL delimiter, the raw SHA-256 digest,
and a newline. Earlier inventory hashes remain preserved as historical evidence.
