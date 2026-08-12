# Seraphim Publication Contract

Apply this contract to every candidate artifact before proposing public release.

## Disposition ledger

| Disposition | Meaning | Publication treatment |
|---|---|---|
| `public-ready` | Owner-controlled, reviewed, supported, licensed, and free of restricted data | May enter the focused publication set |
| `needs-redaction` | Potentially publishable after specific privacy, identifier, metadata, or claim removal | Hold until the redacted result is reviewed |
| `architecture-only` | Useful design record without an audited installable or executable implementation | Publish only as clearly labeled architecture |
| `private` | Personal, sensitive, account-bound, permission-bound, or intentionally non-public | Keep outside GitHub and public packages |
| `duplicate` | Redundant, superseded, generated, or byte/content-equivalent material | Keep one canonical source or omit all copies |
| `third-party` | Created by another party or carrying unresolved redistribution terms | Link or cite when appropriate; do not bundle without authority |

Record the evidence and reason for each disposition. Do not infer `public-ready`
from file location, user ownership of an account, prior installation, or inclusion
in a conversation.

## Hard publication blocks

Block public release of:

- raw chats, private Agent instructions, memory, personal dossiers, psychological
  or medical-style profiles, and identity-linked writing calibration;
- credentials, secrets, tokens, account or installed-skill IDs, private archive
  names, fingerprints, local paths, personal metadata, and unnecessary contact data;
- unsupported security, deployment, verification, authorship, performance, or
  capability claims;
- copied manuals, books, papers, images, generated bundles, or source packages
  without documented redistribution authority;
- coercive, deceptive, unlawful, or clinically overreaching operational guidance.

If sensitive material already exists in public history, distinguish current-tree
redaction from history removal. History rewriting requires separate authorization
and an explicit coordination and recovery plan.

## Public-readiness gates

An artifact is `public-ready` only when all applicable gates pass:

1. **Ownership and provenance:** the source and transformation are documented.
2. **Privacy:** personal, private, account-bound, and local identifiers are absent.
3. **Licensing:** bundled content has confirmed redistribution rights.
4. **Capability truth:** the artifact does not imply unavailable tools, live tests,
   installations, permissions, deployments, or runtime behavior.
5. **Safety:** operational instructions preserve lawfulness, consent, and bounded
   authority.
6. **Consistency:** canonical manifests, registries, READMEs, recovery records,
   architecture, component status, and validation references agree.
7. **Reviewability:** the change is a focused diff on a non-default branch with a
   clear rollback path.

## Pull-request and merge contract

- Separate unrelated publication units into separate branches or PRs.
- Preserve unrelated user changes and repository protections.
- State included, redacted, excluded, and unresolved artifacts in the PR.
- Bind merge approval to the exact repository, PR, and current head commit.
- Treat any new commit, conflict resolution, or head change as invalidating prior
  merge approval.
- Never force-push, bypass protections, or merge through an alternate path.

## Validation contract

Use deterministic structural checks and synthetic fixtures containing invented,
non-sensitive values. Tests may evaluate classification, routing, redaction flags,
reconciliation requirements, and approval state. Tests must not publish packages,
push branches, open or merge PRs, delete files, or change live Agent configuration.

## Required publication record

Produce:

1. candidate and disposition;
2. provenance and ownership basis;
3. redactions or exclusions;
4. canonical records reconciled;
5. validation performed and its limitations;
6. branch, PR, and exact head commit;
7. merge approval state and final landing evidence.
