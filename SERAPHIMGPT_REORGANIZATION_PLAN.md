# SERAPHIMGPT REORGANIZATION PLAN (PROPOSED)

**Target Directory:** `C:\Users\cyber\OneDrive\Documents\Projects\Programs\SeraphimGPT`  
**Status:** The approved document/script ledger, low-risk taxonomy batch, and GitHub/Loki Profile relocation completed on August 14, 2026. All moved content passed count, aggregate-size, and SHA-256 manifest verification. `Seraphim/` remains fixed as the active source root; Archive and EiRAM-only material remain untouched.  

---

## 1. Executive Summary

The SeraphimGPT root directory has accumulated a rich mix of source code, research papers, personal profiles, application portfolios, screenshots, and synchronization scripts. To transform this directory into a clean, professional home base without risking data loss or breaking existing recovery workflows, we propose a structured taxonomy. 

This document outlines the current state, taxonomy design, inventory classification, and exact proposed moves for review.

---

## 2. Proposed Directory Taxonomy

```text
SeraphimGPT/
│
├── Seraphim/
│   ├── Source/             ← Core active / synced Seraphim application source
│   ├── Recovery/           ← Recovery snapshots, tarballs, and diff archives
│   ├── Reports/            ← Forensic reports, white papers, and technical audits
│   ├── Documentation/      ← Project READMEs, setup guides, and architecture specs
│   └── Exports/            ← Exported data, logs, and verification artifacts
│
├── EiRAM/                  ← EiRAM research, lexical rules, and cognitive models
│
├── Research/
│   ├── AGI/                ← AGI training materials, prompts, and notes
│   └── Backmatter/         ← Reference papers, DSM-5, MMPI, and background PDFs
│
├── Development/
│   ├── Scripts/            ← PowerShell sync and hashing utilities (full_sync, gen_hashes, etc.)
│   ├── GitHub/             ← Local GitHub integration working copies / checkouts
│   └── Tools/              ← Auxiliary local utilities and scripts
│
├── Projects/
│   ├── App_Portfolio/      ← Other applications and portfolio projects
│   └── Landing_Pad/        ← Temporary staging for incoming drops
│
├── Personal/
│   └── Loki_Profile/       ← Personal configuration, profile data, and notes
│
├── Media/
│   └── Screenshots/        ← Captured UI screenshots and visual validation logs
│
├── Archive/                ← Deprecated legacy snapshots and older iterations
│
└── README.md               ← Root project directory guide
```

---

## 3. Inventory Classification & Planned Moves

| Item / Pattern | Current Location (Estimated) | Target Location | Classification | Rationale |
|---|---|---|---|---|
| `Seraphim/` (source code) | Root | `Seraphim/Source/` | Active Source | Core application files |
| `SERAPHIM_FORENSIC_HANDOFF_REPORT_v10.1.md` | Root / Project | `Seraphim/Reports/` | Report | Forensic handoff report |
| `SERAPHIM_WHITE_PAPER.md` | Root / Project | `Seraphim/Documentation/` | Documentation | Architectural white paper |
| `todo.md` | Root / Project | `Seraphim/Documentation/` | Task Tracking | Master task backlog |
| `full_sync.ps1`, `gen_hashes*.ps1` | Root | `Development/Scripts/` | Utility Scripts | Sync and hashing scripts; preserved as operational workflow tools |
| `HANDOFF_SETUP.md` | Root | `Seraphim/Documentation/` | Guide | Setup instructions |
| `*.pdf` (DSM-5, MMPI, clinical docs) | Root / Misc | `Research/Backmatter/` | Reference Material | Research papers and clinical reference documents |
| `*.png` / Screenshots | Root / Misc | `Media/Screenshots/` | Visual Artifacts | UI validation captures |
| `App_Portfolio/` | Root | `Projects/App_Portfolio/` | Sub-Project | **Moved and manifest-verified** as a separate application portfolio |
| `AGI Training/` | Root | `Research/AGI/` | Research | **Moved and manifest-verified** training notes and research |
| `Loki Profile/` | Root | `Personal/Loki_Profile/` | Personal | Deferred pending a dedicated content/sensitivity review |
| `GitHub/` | Root | `Development/GitHub/` | Development Workspace | **Moved and manifest-verified**; the contained `Seriphim` Git repository remains clean |
| `Loki Profile/` | Root | `Personal/Loki_Profile/` | Personal | **Moved and manifest-verified** |

### Post-Move Note: Root GitHub Reparse Point

The moved `Development/GitHub/Seriphim` repository is clean and content-identical to the captured source manifest. A root `GitHub/Seriphim` **read-only Windows reparse point** remains after the move. Chris approved retaining it unchanged as a compatibility placeholder on August 14, 2026. It is not the canonical working repository and no deletion or re-linking was performed.

---

## 4. Operational Script Evaluation

- **`full_sync.ps1`**: Operational (used for syncing files between sandbox and OneDrive/desktop via base64 encoding). Reclassified to `Development/Scripts/`.
- **`gen_hashes.ps1`, `gen_hashes_filtered.ps1`, `gen_hashes_v10.ps1`**: Operational/Historical hashing utilities. Reclassified to `Development/Scripts/`.
- **`HANDOFF_SETUP.md`**: Active guide. Reclassified to `Seraphim/Documentation/`.

---

## 5. Next Steps

1. Review this proposed plan.
2. Approve or adjust specific directory placements.
3. Upon approval, authorize Phase 2 to execute the non-destructive moves, preserving all file timestamps and generating an execution move log.
