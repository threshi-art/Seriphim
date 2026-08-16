# Seraphim Platform v9 — Document Index

**Program:** Seraphim Platform v9  
**Baseline:** Seraphim Program White Paper v8.0 (`SERAPHIM_WHITE_PAPER.md`)  
**Classification:** UNCLASSIFIED // Operator Controlled  
**Status:** Controlled first draft (Phase 0–1)

## Purpose

This package provides DO-178-style planning, requirements, design, verification, configuration, quality, and release evidence for the controlled evolution of Seraphim from a web command center into a multi-surface platform:

1. Seraphim Web Command Center (existing)
2. Seraphim Desktop Companion (MVP cockpit, mock execution)
3. `seraphim_local_bridge` (future)
4. iPhone Mobile Cockpit (future)

## Document Map

| ID | Path | Title |
|----|------|-------|
| DOC-00-01 | `00_program/document_index.md` | Document Index |
| DOC-00-02 | `00_program/glossary.md` | Glossary |
| DOC-00-03 | `00_program/program_charter.md` | Program Charter |
| DOC-00-04 | `00_program/white_paper_baseline.md` | White Paper Baseline Reference |
| DOC-00-05 | `00_program/baseline_assessment.md` | Repository Baseline Assessment |
| DOC-00-06 | `00_program/gap_analysis.md` | Gap Analysis |
| DOC-00-07 | `../versioning/CHANGELOG.md` | Running Change Log (operator index) |
| DOC-00-08 | `../versioning/VERSION.json` | Version & status metadata |
| DOC-01-01 | `01_plans/psac.md` | Plan for Software Aspects of Certification (PSAC-style) |
| DOC-01-02 | `01_plans/software_development_plan.md` | Software Development Plan |
| DOC-01-03 | `01_plans/software_verification_plan.md` | Software Verification Plan |
| DOC-01-04 | `01_plans/configuration_management_plan.md` | Configuration Management Plan |
| DOC-01-05 | `01_plans/quality_assurance_plan.md` | Quality Assurance Plan |
| DOC-01-06 | `01_plans/desktop_companion_mvp_plan.md` | Desktop Companion MVP Plan |
| DOC-01-08 | `01_plans/phase4_read_only_implementation_plan.md` | Phase 4 Read-Only Implementation Plan |
| DOC-01-09 | `tasks/SERAPHIM_PLATFORM_COMPLETION.md` | Seraphim Platform Completion Program (65 tasks / 6 gates) |
| DOC-02-01 | `02_requirements/system_requirements.md` | System Requirements |
| DOC-02-02 | `02_requirements/high_level_requirements.md` | High-Level Requirements |
| DOC-02-03 | `02_requirements/low_level_requirements.md` | Low-Level Requirements |
| DOC-02-04 | `02_requirements/hazard_derived_requirements.md` | Hazard-Derived Requirements |
| DOC-02-05 | `02_requirements/interface_control_document.md` | Interface Control Document |
| DOC-02-06 | `02_requirements/data_dictionary.md` | Data Dictionary |
| DOC-02-07 | `02_requirements/requirements_trace_matrix.md` | Requirements Trace Matrix |
| DOC-03-01 | `03_design/software_architecture.md` | Software Architecture |
| DOC-03-02 | `03_design/detailed_design.md` | Detailed Design |
| DOC-03-03 | `03_design/agent_behavior_design.md` | Agent Behavior Design |
| DOC-03-04 | `03_design/security_architecture.md` | Security Architecture |
| DOC-03-05 | `03_design/ui_design_specification.md` | UI Design Specification |
| DOC-03-06 | `03_design/tool_permission_matrix.md` | Tool Permission Matrix |
| DOC-03-07 | `03_design/prompt_policy_baseline.md` | Prompt Policy Baseline |
| DOC-03-08 | `03_design/human_approval_procedure.md` | Human Approval Procedure |
| DOC-03-09 | `03_design/rollback_and_recovery_plan.md` | Rollback and Recovery Plan |
| DOC-03-11 | `03_design/phase4_workspace_read_api.md` | Phase 4 Workspace Read API |
| DOC-04-01 | `04_verification/verification_cases_and_procedures.md` | Verification Cases and Procedures |
| DOC-04-02 | `04_verification/verification_results.md` | Verification Results |
| DOC-04-03 | `04_verification/test_coverage_report.md` | Test Coverage Report |
| DOC-04-04 | `04_verification/static_analysis_report.md` | Static Analysis Report |
| DOC-04-05 | `04_verification/code_review_records.md` | Code Review Records |
| DOC-05-01 | `05_configuration/software_configuration_index.md` | Software Configuration Index |
| DOC-05-02 | `05_configuration/environment_configuration_index.md` | Environment Configuration Index |
| DOC-05-03 | `05_configuration/build_procedure.md` | Build Procedure |
| DOC-05-04 | `05_configuration/release_notes.md` | Release Notes |
| DOC-05-05 | `05_configuration/change_control_log.md` | Change Control Log |
| DOC-05-06 | `05_configuration/problem_report_log.md` | Problem Report Log |
| DOC-05-07 | `05_configuration/third_party_software_inventory.md` | Third-Party Software Inventory |
| DOC-06-01 | `06_quality/sqa_audit_records.md` | SQA Audit Records |
| DOC-06-02 | `06_quality/conformity_review_checklist.md` | Conformity Review Checklist |
| DOC-06-03 | `06_quality/release_approval_checklist.md` | Release Approval Checklist |
| DOC-07-01 | `07_release/software_accomplishment_summary.md` | Software Accomplishment Summary |
| DOC-07-02 | `07_release/user_manual.md` | User Manual |
| DOC-07-03 | `07_release/operator_safety_guide.md` | Operator Safety Guide |
| DOC-07-04 | `07_release/maintenance_manual.md` | Maintenance Manual |

## Authority Order

1. Operator decisions and explicit approvals
2. `AGENTS.md` safety and development rules
3. This documentation package
4. `tasks/SERAPHIM_PLATFORM_COMPLETION.md` and its linked gate specifications for remaining implementation sequencing
5. White Paper v8.0 baseline facts
6. Implementation code

## Doctrine

Powerful, but safe. Useful, but auditable. Local, but permissioned. Agentic, but never ungoverned.
