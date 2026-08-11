# Audit Report Contract

## Scope record

- `roots`: Exact resolved roots inspected.
- `includes`: In-scope paths or file classes.
- `excludes`: Paths intentionally omitted.
- `boundaries`: Repositories, worktrees, submodules, synced folders, and links.
- `instructions`: Owning policy files and ignore rules.
- `limitations`: Access, tooling, or evidence limits.

## Finding record

Every finding contains:

| Field | Requirement |
|---|---|
| `id` | Stable identifier within the report |
| `category` | Exposure, duplication, generated artifact, drift, stale material, or structure |
| `evidence` | Exact path and observable fact, with sensitive values redacted |
| `inference` | Interpretation kept separate from evidence |
| `risk` | Consequence and affected boundary |
| `confidence` | High, medium, or low with basis |
| `recommendation` | Exact, bounded next action |
| `owner` | Person or workflow responsible for deciding |
| `authorization` | `not_required`, `required`, or `granted` |
| `recovery` | How a proposed mutation would be reversed |

## Status values

- `confirmed`: Evidence directly supports the finding.
- `suspected`: More inspection is needed.
- `no_finding`: The suspected issue was not supported.
- `out_of_scope`: The evidence lies outside authorized roots.
- `blocked`: Access or policy prevents safe inspection.

An audit report never uses `authorization: granted` to imply that a mutation
was executed or completed.
