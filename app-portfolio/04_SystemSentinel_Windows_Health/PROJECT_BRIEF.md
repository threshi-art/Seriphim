# SystemSentinel Windows Health

## Mission Statement

Create a defensive Windows maintenance dashboard that runs approved health checks, explains results, and produces clear remediation reports.

## Product Thesis

The folder already contains PowerShell checks and a Java/Maven app structure. This can become a practical local utility for system health, security posture, and maintenance evidence.

## Proposed Architecture

- UI: desktop dashboard grouped by system health, security, performance, inventory, and logs.
- Check runner: allowlisted PowerShell scripts only.
- Results store: SQLite or JSONL history with timestamps and status.
- Report generator: Markdown/PDF summaries for each run.
- Safety model: no destructive fixes by default; remediation suggestions first.

## Source Material

- `Seraphim/SystemSentinel/`
- `SystemSentinel/scripts/check-*.ps1`
- Seraphim Sentinel tRPC router and page

## MVP Scope

- List checks
- Run non-destructive checks
- Save pass/warning/fail results
- Generate one system health report

## Open Questions

- Should this remain inside Seraphim or become a standalone Windows app?
- Which checks are safe enough for first-run defaults?
