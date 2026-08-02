# Hazard-Derived Requirements (HAZ)

| ID | Hazard | Derived Requirement |
|----|--------|---------------------|
| HAZ-001 | Unapproved shell execution damages system | Red shell requires explicit approval and is disabled in MVP |
| HAZ-002 | File deletion loses operator data | Real delete disabled until approval + rollback plan exist |
| HAZ-003 | Secret leakage via localStorage | API keys must not be stored in desktop localStorage |
| HAZ-004 | Prompt injection triggers tools | Tool router must ignore untrusted instruction to bypass approvals |
| HAZ-005 | Phone remote control of desktop | Mobile may only approve/reject, never execute directly |
| HAZ-006 | Autonomous destructive loops | No hidden background automation in MVP |
| HAZ-007 | Workspace escape | Bridge must enforce approved workspace boundaries |
| HAZ-008 | False sense of safety from mock UI | Mock/simulated labels mandatory |
