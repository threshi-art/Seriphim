# Seraphim Synapse MCP Relay — Manus Integration Boundary

## Status

**DOCUMENTED ONLY — NOT CONNECTED.** The Windows-local Synapse relay has been locally validated, but neither a tunnel-client runtime nor a Manus-side connector, adapter, listener, transport, or message path is configured by this record.

## Local relay identity and process boundary

The relay is a Windows-local stdio MCP server located outside OneDrive and outside the Seraphim repository:

```text
%LOCALAPPDATA%\Seraphim\Synapse\
```

Its exact future process command is:

```text
"C:\Program Files\nodejs\node.exe" "%LOCALAPPDATA%\Seraphim\Synapse\server.mjs"
```

The relay exposes only `send_message`, `read_messages`, and `heartbeat`, with fixed `SERAPHIM` and `MANUS` identities. Its message types are `MESSAGE`, `PING`, and `PONG`. Durable relay records remain confined to `synapse.db` and append-only `audit.jsonl` under the same `%LOCALAPPDATA%` directory.

> This design record does **not** make the relay available to the current Seraphim Runtime, Desktop Companion, website, iOS surface, Manus task, or custom Seraphim Codex chat.

## Manus-side boundary

No Manus repository component, managed-project setting, custom connector, MCP registration, bridge, or deployment currently starts or calls the relay. The Manus execution environment must not assume direct access to Windows-local stdio, `%LOCALAPPDATA%`, the relay database, or its audit log.

The only contemplated future attachment point is a separately reviewed Windows-local `tunnel-client-runtime.exe` configuration that launches the command above via `MCP_COMMAND`. That integration is explicitly **out of scope** until the operator authorizes connection, transport identity, tool allowlisting, startup/restart behavior, audit reconciliation, and rollback handling.

## Permitted V0 message semantics

| Tool | Permitted role | Prohibited role |
|---|---|---|
| `send_message` | Persist exactly one relay message with sender, recipient, permitted type, payload, timestamp, and append-only audit event | Execute commands, mutate files outside Synapse, change approvals, initiate Runtime work, invoke a model, or open a network connection |
| `read_messages` | Retrieve unread messages for a fixed recipient and mark them read only after successful retrieval | Read another identity’s inbox, inspect unrelated local state, or infer approval/execution authority |
| `heartbeat` | Report local version, UTC timestamp, agent identities, and relay database health | Assert that a tunnel, Runtime, Desktop, web client, iOS client, or custom Codex chat is connected |

## First interoperability test — planned, not executed

The first cross-agent test remains intentionally limited to a single durable, non-consequential message:

```text
SERAPHIM -> MANUS : PING
```

The test may begin only after a separately authorized connection exists. The receiving agent must retrieve the message through `read_messages` and verify the audit record. No automatic response, command, action proposal, file mutation, approval decision, Runtime change, or tunnel expansion follows from receipt. A `MANUS -> SERAPHIM : PONG` is a later separately authorized confirmation, not an automatic behavior.

## Preconditions before connection

1. The operator explicitly authorizes the Windows-local tunnel-client runtime to launch the relay process.
2. The exact executable, relay command, endpoint identity, and secret-handling model are independently reviewed.
3. The relay remains tool-limited to the V0 surface and starts with no arbitrary shell, filesystem, approval, Runtime, or execution capability.
4. Startup, shutdown, restart, message-read acknowledgement, audit failure, database corruption, and duplicate-delivery behavior have written tests and rollback guidance.
5. The connection record explicitly distinguishes the Windows-local Codex CLI, the custom Seraphim Codex chat, Manus, and the Synapse relay. None may be represented as another.

## Explicit exclusions

This record does not install, connect, register, enable, start, or invoke `tunnel-client-runtime.exe`; change the Windows firewall, registry, services, or system-wide packages; add a network listener; alter Seraphim source behavior; expose the relay externally; or treat a relay message as authorization for any consequential action.
