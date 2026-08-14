# Seraphim GitHub Baseline Status

**Date:** August 14, 2026  
**Purpose:** Record the exact relationship between the active Seraphim source checkpoint and the accessible GitHub repository without pushing, reconciling, or overwriting any external branch.

## Verified Commit Identities

| Source | Commit SHA | Status |
|---|---:|---|
| Active Seraphim project checkpoint | `34fa9cc8d8a059a98a1757f3450d75a87a9531cd` | Local managed-project state, including Mission 03 storage abstraction |
| Earlier v10.1 recovery baseline | `bcc0f6ce6f9d53e6eca2bab298b3b93626c33b42` | Independently rebuilt and test-verified before later Mission 02/03 work |
| GitHub `threshi-art/Seriphim` `main` | `34bbe9155f5d1652287142aa794364ea9e06b036` | Accessible, but divergent from the active managed-project history |

## Comparison Result

**GitHub baseline: PARTIAL.** The active project and GitHub `main` have no direct ancestor relationship. The comparison reports 680 differing paths and substantial structural divergence. GitHub `main` contains a `seraphim-platform/` hierarchy and broader portfolio/documentation content, while the active managed project remains rooted at `/home/ubuntu/seraphim`.

This means the exact v10.1 recovery commit (`bcc0f6ce…`) and the current Mission 03 checkpoint (`34fa9cc8…`) are **not yet proven to be represented in the GitHub repository**.

## Safety Decision

No GitHub branch, tag, force-push, merge, or overwrite was attempted. The configured GitHub integration is disabled, and no authenticated write channel is available in this task. This avoids accidental loss or contamination of the distinct GitHub source tree.

## Required Human-Approved Follow-up

Enable the GitHub integration or use the project Management UI’s GitHub export flow. Then create a dedicated branch such as `recovery/seraphim-v10.1-bcc0f6ce` from the verified v10.1 source, add only safe source/docs/manifests, and re-run the recovery build from that branch. Exclude secrets, database contents, private memory, local-agent logs, token files, certificates, and personal investigations.
