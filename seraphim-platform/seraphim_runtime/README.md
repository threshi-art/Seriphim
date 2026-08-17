# Seraphim Runtime Foundation — G1-02

This dependency-free Python package is the **bounded local Runtime foundation** for G1-02. It provides only configuration, fail-closed storage resolution, SQLite connection access, a narrow health service/reporting boundary, and evidence-preserving legacy-file migration support.

It intentionally does **not** implement missions, task execution, workers, approvals, APIs, client controls, web-MySQL synchronization, identity mapping, replication, or shared database authority. Those concerns remain owned by later Gate 1 tasks.

## Persistence policy

Production SQLite state defaults to `%LOCALAPPDATA%\Seraphim\Runtime\seraphim.db`. A persistent override must be absolute, stay below `LOCALAPPDATA`, and must not resolve within the repository, configured workspace, or known OneDrive root. Any ambiguous or unsafe path fails closed.

Tests may use `:memory:` or a temporary-directory file only with explicit ephemeral opt-in. Legacy migration copies selected files into a Runtime evidence directory with hashes and an atomic state manifest; it does not delete or rewrite sources.

## Validation

Run the focused suite with a supported interpreter:

```powershell
py -3.13 -m unittest discover -s seraphim_runtime\tests -v
```

The tests cover default and explicit storage resolution, path rejection, ephemeral storage, migration inventory, hash verification, idempotence, simulated interruption recovery, non-deletion, and rollback recording.
