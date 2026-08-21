# Synapse Relay V0 — Local Validation Record

## Status

**LOCAL RELAY VALIDATED; MANUS INTEGRATION NOT CONNECTED.**

The Windows-local relay at `%LOCALAPPDATA%\Seraphim\Synapse` was tested through a local stdio MCP client only. The validation did not start an OpenAI tunnel, register an MCP connector, open a network port, change the firewall or registry, install a service, or modify the Seraphim repository.

## Observed local test

| Check | Result |
|---|---|
| MCP server tool discovery | Exactly `send_message`, `read_messages`, and `heartbeat` |
| Relay health | Database health reported through the local heartbeat tool |
| SERAPHIM → MANUS | Durable `PING` written, retrieved through `read_messages`, and marked read after retrieval |
| MANUS → SERAPHIM | Durable `PONG` written, retrieved through `read_messages`, and marked read after retrieval |
| Audit | Append-only JSONL audit record created for heartbeat, write, and retrieval events |
| Source isolation | Canonical Windows Seriphim repository not modified by the relay build or test |

The local test output was:

```text
LOCAL_MCP_TEST_PASS
PING_PONG_PASS
```

## Remaining integration boundary

This result proves only local stdio tool behavior. It does not prove cross-environment transport, managed Manus access, tunnel operation, persistent connection, custom Seraphim Codex-chat access, or authorization for any action. The future first connection test remains the planned single `SERAPHIM -> MANUS : PING` record defined in the corresponding integration-boundary document.
