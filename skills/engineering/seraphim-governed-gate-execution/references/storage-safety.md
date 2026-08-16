# Local Runtime Storage Safety

Production local Runtime state is under `%LOCALAPPDATA%\Seraphim\Runtime`. Tests prefer SQLite `:memory:` and temporary directories. Never create durable Runtime state below a Git checkout, repository subtree, configured workspace, OneDrive source tree, or browser profile.

| Scenario | Expected result |
|---|---|
| Default `%LOCALAPPDATA%` | Resolve safe Runtime directory. |
| Explicit safe override | Resolve only after canonical path safety check. |
| Missing `%LOCALAPPDATA%` | Fail closed with actionable configuration error. |
| Repository / descendant override | Reject. |
| OneDrive / descendant override | Reject. |
| `:memory:` test target | Permit without durable file creation. |
| Temporary target | Permit only within an isolated temporary directory. |
| Legacy evidence migration | Preserve raw evidence, manifest, hashes, idempotency, interruption recovery, retention, rollback, and non-deletion. |

After tests, scan the active source and publication scopes for `.db`, `.sqlite`, `.sqlite3`, `-journal`, `-wal`, and `-shm` files. Treat an unexpected file as a failure until explained and removed from active scope without touching unrelated user data.

