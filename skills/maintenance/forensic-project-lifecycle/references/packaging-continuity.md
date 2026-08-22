# Packaging, Delivery, and Continuity

Use this reference when preparing submissions, handoffs, reviewer materials, backups, or cloud-to-local transfers.

## Separate artifact classes

Keep four explicit classes:

| Class | Typical contents | Delivery policy |
|---|---|---|
| Originals | User, instructor, customer, or owner inputs | Preserve; never submit as generated work |
| Working evidence | Baselines, logs, tests, screenshots, coverage, scripts, inventories | Retain locally; provide only when requested |
| Reviewer material | White paper, audit, change log, check-my-work guides, verification scripts | Deliver separately from the formal submission |
| Submission artifacts | Exact allowed source archive and required documentation | Upload only these files |

Do not place support records inside a source-only archive. Label every delivery-folder file as `submit` or `support only`.

## Build an allowlist package

1. Read the authoritative submission rules.
2. Define the exact allowed root-level filenames or paths.
3. Stage from the audited working checkpoint, not from an ad hoc folder.
4. Generate source hashes before compression.
5. Build the archive with deterministic ordering when possible.
6. Inspect archive membership and reject extras, generated files, logs, binaries, caches, credentials, tests, or evidence unless required.
7. Extract into a new empty directory.
8. Build and run the complete regression suite from that extraction.
9. Compare extracted source hashes with the audited working source.
10. Record final archive and documentation sizes and SHA-256 values.

Never edit, recompress, or rename the verified submission files after final hashing.

## Create check-my-work material

Create a separate review folder with:

- `README_FIRST.md` describing artifact roles and safe-review boundaries.
- Tool-specific instructions for likely reviewers, such as Cursor or ChatGPT.
- A manual checklist covering archive membership, clean build, representative tests, errors, documentation, and separation.
- A one-command verifier when practical.
- Read-only copies of key manifests, matrices, audit totals, and hashes.

State that static reviewers cannot prove execution without transcripts or a runnable environment. Require structured verdicts that distinguish confirmed facts, concerns, and untested assumptions.

## Write submission instructions

State the exact directory, filenames, sizes, hashes, upload order, and which files must not be submitted. Tell the user to verify portal attachments after upload. Do not perform the final submission without explicit confirmation.

## Preserve changed or conflicting artifacts

If a supposedly verified file changes:

1. Do not overwrite or delete it.
2. Preserve it under a timestamped `UNVERIFIED` name in at least one separate location.
3. Compare sizes, hashes, archive membership, and timestamps.
4. Restore the known verified copy only after confirmation.
5. Recompute all hashes and save a synchronization report.

## Transfer cloud artifacts locally

Inventory only task-relevant cloud paths. Exclude secret stores, connector configuration, browser profiles, cookies, device-authorization pages, shell history, environment files, and unrelated runtime folders.

Create both:

- An extracted local directory for convenient review.
- An immutable TAR or equivalent archive that preserves hidden Git directories, executable bits, links, and relative paths.

Generate a SHA-256 manifest for every regular file and a separate link manifest. Verify the archive by fresh extraction before transfer, then verify the local extracted copy against the original manifest and verify the local archive hash against a sidecar checksum.

If the local device connection fails after a mounted-path copy, report the redundant confirmation failure transparently. Do not misrepresent it as a failed copy when the mounted local destination and hashes were already verified.

## Continuity and OneDrive rules

For intermittent sync folders, keep a non-sync backup of critical submission files and evidence. Check local availability before large operations. Avoid recreating files merely because the sync client is temporarily disconnected. After copying large archives, allow synchronization to finish before shutdown or relocation.

## Final delivery audit

Require machine-readable checks for:

- Archive purity and exact membership.
- Source hash parity.
- Clean extracted build.
- Complete package regression.
- Documentation integrity.
- Original/submission/reviewer separation.
- Offline or local backup parity.
- Final instruction accuracy.

Deliver information-rich final artifacts, not intermediate notes. Attach the primary submission or review package first, followed by key reports and evidence in descending importance.
