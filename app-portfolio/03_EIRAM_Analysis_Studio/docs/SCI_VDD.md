# Software Configuration Index / Version Description Document

## EI-RAM Analysis Studio

> **Frozen baseline notice:** This document describes the July 2026 planning
> baseline. The later curated Phase-1 prototype under `../engine-api/` includes
> a FastAPI engine, desktop shell, and tests. Current repository status takes
> precedence over the pre-implementation statements retained below.

### Revision History

| Version | Date | Author | Description |
|---|---|---|---|
| 0.1 | 2026-07-09 | Codex | Initial SCI/VDD draft for EI-RAM Analysis Studio planning baseline |

## 1. Introduction

### 1.1 Purpose

This Software Configuration Index / Version Description Document identifies the current EI-RAM Analysis Studio configuration baseline and describes the contents, version status, known limitations, and release readiness of the project.

This document combines two related configuration-management artifacts:

- Software Configuration Index (SCI): identifies controlled configuration items.
- Version Description Document (VDD): describes the current version baseline, included artifacts, exclusions, and known issues.

### 1.2 Scope

This SCI/VDD applies to the frozen EI-RAM Analysis Studio planning baseline
`EIRAM-STUDIO-0.1`.

At that baseline, the project was documentation-first and pre-implementation.
It included project folders, planning documents, design documents, data design,
standards, and placeholders for future frontend, backend, shared, data,
research, and test work.

The frozen baseline did not include a working standalone EI-RAM Studio
executable, frontend, backend, SQLite database, or automated test suite. The
later Phase-1 engine import is tracked separately under `../engine-api/`.

### 1.3 Reference Material

- `PROJECT_BRIEF.md`
- `README.md`
- `docs/SDD.md`
- `docs/REQUIREMENTS.md`
- `docs/DATA_DESIGN_DOCUMENT.md`
- `docs/SOFTWARE_Y_DRAWING.md`
- `docs/ARCHITECTURE.md`
- `docs/MVP_PLAN.md`
- `docs/ROADMAP.md`
- `ACADEMIC_AND_DESIGN_STANDARDS.md`
- `AGENTS.md`

### 1.4 Definitions and Acronyms

| Term | Definition |
|---|---|
| SCI | Software Configuration Index |
| VDD | Version Description Document |
| CI | Configuration Item |
| EI-RAM | Narrative, ideological, escalation, emotional, and forecast analysis framework |
| Baseline | Controlled set of project artifacts at a defined point in time |
| MVP | Minimum Viable Product |
| SDD | Software Design Document |
| SRS | Software Requirements Specification |

## 2. Version Identification

| Field | Value |
|---|---|
| Product Name | EI-RAM Analysis Studio |
| Baseline ID | `EIRAM-STUDIO-0.1` |
| Baseline Type | Planning and design documentation baseline |
| Baseline Date | 2026-07-09 |
| Release Status | Pre-implementation draft |
| Target Platform | Local Windows development machine |
| Planned Backend | FastAPI |
| Planned Frontend | React |
| Planned Database | SQLite |
| Planned Export Format | Markdown |

## 3. Configuration Item Index

### 3.1 Project Root Configuration Items

| CI ID | Configuration Item | Path | Status | Baseline |
|---|---|---|---|---|
| CI-001 | Project Brief | `PROJECT_BRIEF.md` | Created | `EIRAM-STUDIO-0.1` |
| CI-002 | Project README | `README.md` | Created | `EIRAM-STUDIO-0.1` |
| CI-003 | Academic and Design Standards | `../ACADEMIC_AND_DESIGN_STANDARDS.md` | Shared current location; project copy removed | `EIRAM-STUDIO-0.1` |
| CI-004 | Codex Instructions | `../AGENTS.md` | Shared current location; project copy removed | `EIRAM-STUDIO-0.1` |

### 3.2 Design and Planning Configuration Items

| CI ID | Configuration Item | Path | Status | Baseline |
|---|---|---|---|---|
| CI-101 | Software Design Document | `docs/SDD.md` | Created | `EIRAM-STUDIO-0.1` |
| CI-102 | Software Requirements Specification | `docs/REQUIREMENTS.md` | Created | `EIRAM-STUDIO-0.1` |
| CI-103 | Data Design Document | `docs/DATA_DESIGN_DOCUMENT.md` | Created | `EIRAM-STUDIO-0.1` |
| CI-104 | Software Y-Drawing | `docs/SOFTWARE_Y_DRAWING.md` | Created | `EIRAM-STUDIO-0.1` |
| CI-105 | Architecture Notes | `docs/ARCHITECTURE.md` | Created | `EIRAM-STUDIO-0.1` |
| CI-106 | Draft Data Model | `docs/DATA_MODEL.md` | Created | `EIRAM-STUDIO-0.1` |
| CI-107 | MVP Plan | `docs/MVP_PLAN.md` | Created | `EIRAM-STUDIO-0.1` |
| CI-108 | Roadmap | `docs/ROADMAP.md` | Created | `EIRAM-STUDIO-0.1` |
| CI-109 | Ingestion Notes | `docs/INGESTION_NOTES.md` | Created | `EIRAM-STUDIO-0.1` |
| CI-110 | Report Template | `docs/REPORT_TEMPLATE.md` | Created | `EIRAM-STUDIO-0.1` |
| CI-111 | SCI/VDD | `docs/SCI_VDD.md` | Created | `EIRAM-STUDIO-0.1` |

### 3.3 Placeholder Implementation Configuration Items

| CI ID | Configuration Item | Path | Status | Baseline |
|---|---|---|---|---|
| CI-201 | Backend Placeholder | `app/backend/README.md` | Placeholder | `EIRAM-STUDIO-0.1` |
| CI-202 | Frontend Placeholder | `app/frontend/README.md` | Placeholder | `EIRAM-STUDIO-0.1` |
| CI-203 | Shared Placeholder | `app/shared/README.md` | Placeholder | `EIRAM-STUDIO-0.1` |
| CI-204 | Sample Data Placeholder | `data/samples/README.md` | Placeholder | `EIRAM-STUDIO-0.1` |
| CI-205 | Research Placeholder | `research/README.md` | Placeholder | `EIRAM-STUDIO-0.1` |
| CI-206 | Tests Placeholder | `tests/README.md` | Placeholder | `EIRAM-STUDIO-0.1` |

### 3.4 Post-Baseline Cross-References

These current repository locations supersede or extend the frozen 0.1 baseline.
Paths are relative to the repository root.

| CI ID | External Source | Path | Status |
|---|---|---|---|
| EXT-001 | Curated EI-RAM FastAPI project | `app-portfolio/03_EIRAM_Analysis_Studio/engine-api/` | Tracked |
| EXT-002 | Public EI-RAM project documents | `app-portfolio/03_EIRAM_Analysis_Studio/docs/` | Tracked |
| EXT-003 | Seraphim EI-RAM integration | `seraphim-platform/server/eiram.ts` | Referenced |
| EXT-004 | Seraphim Analysis UI | `seraphim-platform/client/src/pages/dashboard/AnalysisPage.tsx` | Referenced |

## 4. Version Description

### 4.1 Included in Baseline `EIRAM-STUDIO-0.1`

This baseline includes:

- Project folder structure
- Project brief
- README
- Academic and software-design standards
- Codex project instructions
- MVP plan
- Roadmap
- SDD draft
- Requirements draft
- Data Design Document
- Software Y-Drawing
- Data model notes
- Report template
- Placeholder folders for future implementation

### 4.2 Excluded from Baseline `EIRAM-STUDIO-0.1`

This baseline excludes:

- Working backend implementation
- Working frontend implementation
- SQLite database file
- Migration scripts
- Engine adapter code
- Report export code
- Automated tests
- Packaged executable or installer
- Seraphim Command Center integration
- LLM-powered deep analysis
- PDF/DOCX ingestion

### 4.3 Current Functional Capability

The current baseline provides documentation and project organization only. It does not provide executable product functionality.

Current capability:

- Documents intended EI-RAM Studio mission and architecture.
- Defines MVP requirements and data design.
- Identifies planned configuration items.
- Preserves course-aligned documentation standards.
- Establishes future implementation folders.

### 4.4 Planned Next Version

The planned next version is `EIRAM-STUDIO-0.2`, expected to begin implementation scaffolding.

Candidate scope:

- Backend application skeleton
- Engine adapter wrapper
- SQLite schema implementation
- Basic API endpoints
- Initial tests for validation and response shape

## 5. Build and Installation Description

### 5.1 Current Build Status

No build process exists for `EIRAM-STUDIO-0.1`.

### 5.2 Planned Build Approach

The planned MVP build approach is:

- Backend: Python FastAPI service
- Frontend: React application
- Database: SQLite local file
- Exports: Markdown reports written to local `data/exports/`

### 5.3 Current Installation Status

No installation process exists for `EIRAM-STUDIO-0.1`.

## 6. Verification Status

### 6.1 Verification Performed

Current verification is limited to file presence checks performed during document creation.

Verified artifacts:

- Project folders exist.
- Standards files exist.
- SDD exists.
- Requirements document exists.
- Data Design Document exists.
- Software Y-Drawing exists.
- SCI/VDD exists.

### 6.2 Verification Not Yet Performed

Not yet performed:

- Unit testing
- API testing
- UI testing
- Database migration testing
- Export testing
- Integration testing
- User acceptance testing

### 6.3 Planned Verification

Future verification shall include:

- Engine adapter tests
- Empty-input validation tests
- Case persistence tests
- Case reopen tests
- Markdown export tests
- API response shape tests
- Requirements traceability checks

## 7. Known Problems and Limitations

| ID | Problem or Limitation | Impact | Disposition |
|---|---|---|---|
| KP-001 | The 0.1 baseline had no executable EI-RAM Studio implementation | Could not run standalone app at that baseline | Partially superseded by the Phase-1 prototype |
| KP-002 | The 0.1 baseline had not copied or wrapped the EI-RAM engine | Backend integration was not established at that baseline | Superseded by the curated `engine-api/` import |
| KP-003 | Input length limit is not finalized | Validation rule remains draft | Open |
| KP-004 | Export directory is not finalized | Report storage path remains draft | Open |
| KP-005 | Audit events are recommended but not confirmed as MVP | Audit persistence may shift phase | Open |

## 8. Configuration Control Notes

Changes to this baseline should be handled by updating:

- The affected document
- This SCI/VDD
- Requirements traceability if requirements are added, removed, or renumbered
- Roadmap if phase scope changes
- Software Accomplishment Summary when work is completed

## 9. Approval Status

| Role | Name | Status | Date |
|---|---|---|---|
| Project Owner | Repository owner | Pending Review | TBD |
| Technical Author | Codex | Draft Complete | 2026-07-09 |

## 10. Appendix A: Baseline Folder Summary

```text
03_EIRAM_Analysis_Studio/
  AGENTS.md
  ACADEMIC_AND_DESIGN_STANDARDS.md
  PROJECT_BRIEF.md
  README.md
  app/
    backend/
    frontend/
    shared/
  data/
    samples/
  docs/
    ARCHITECTURE.md
    DATA_DESIGN_DOCUMENT.md
    DATA_MODEL.md
    INGESTION_NOTES.md
    MVP_PLAN.md
    REPORT_TEMPLATE.md
    REQUIREMENTS.md
    ROADMAP.md
    SCI_VDD.md
    SDD.md
    SOFTWARE_Y_DRAWING.md
  research/
  tests/
```
