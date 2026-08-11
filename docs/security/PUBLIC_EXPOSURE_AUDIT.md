# Public Exposure and Security Audit

**Review date:** 2026-08-10  
**Scope:** current Git working tree plus targeted full-history exposure checks  
**Method:** manual source review, deterministic tests, high-confidence secret
patterns, path/provenance inventory, and build verification

## Outcome

No high-confidence credential or private-key pattern was found in the current
tree or reachable commit history. No validated security finding remains open in
the reviewed current tree.

The review did identify and remediate four security boundary weaknesses and a
set of public-curation issues before release:

| Area | Previous exposure | Remediation |
|---|---|---|
| Web listener and anonymous fallback | The prototype could bind beyond loopback, and its shared development identity had administrator privileges | Default binding is now `127.0.0.1`; production anonymous fallback is disabled; the development identity is a normal user |
| Conversation deletion | Messages could be deleted before ownership of the parent conversation was established | Ownership is verified before either record type is deleted, with a non-revealing not-found response |
| Storage proxy | A caller could request a signed read URL for an arbitrary storage key | Requests now require authentication and are limited to `uploads/{user-id}/...` without traversal segments |
| Local agent | Broad hosted origins could read local responses; execution and write tools were not uniformly gated; lexical path checks could cross junctions | Remote origins require an exact operator allowlist, mutating/executing tools require trusted-workspace mode, and paths are checked through canonical filesystem resolution |

Regression coverage was added for loopback defaults, production authentication,
storage ownership, anonymous privilege, exact-origin behavior, trusted-tool
gating, and Windows junction escape attempts.

## Public curation

The following material was removed because its redistribution basis was not
documented or because it duplicated an authoritative source:

- twelve imported raster images;
- four absent but referenced third-party audio tracks and their player UI;
- one externally loaded map image;
- the generated PDF copy of the Markdown white paper.

The landing page now uses original CSS-only visuals and no longer sends a
visitor's address to a third-party geolocation service. The public asset decision
is recorded in `docs/provenance/ASSET_REGISTER.md`.

## History and privacy limitations

Targeted history scans found no high-confidence token, access-key, or private-key
signature. Earlier commits do contain obsolete machine-specific paths and the
removed media. Removing those objects from Git history would require a
destructive, coordination-heavy history rewrite; this review does not claim that
such a rewrite occurred. If the repository ever contained a real credential,
rotation remains mandatory even after history rewriting.

Raw project conversations, personal dossiers, clinical instruments, private
Agent memory, and unaudited Skill archives remain excluded. Conversation history
was used only to recover architecture and capability status.

## Coverage and residual risk

Reviewed surfaces included authentication and cookies, tRPC authorization,
conversation ownership, storage signing, local-agent CORS and path containment,
process execution gates, desktop bridge boundaries, Argus Vigil's API scaffold,
EI-RAM public research, desktop WebView integration, and System Sentinel command
selection.

This was a standard single-pass current-tree review. Independent parallel
security workers were not available in this environment, so the result does not
claim variance reduction or a penetration test. External services, deployment
configuration, dependency vulnerabilities, and production infrastructure were
not exercised. A new review is required before binding either server to a
non-loopback interface or enabling remote local-agent origins.
