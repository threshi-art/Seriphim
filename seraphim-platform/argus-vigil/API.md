# Argus Vigil API Design

The API is served by the local or server side capture backend. The browser dashboard consumes these endpoints but does not capture raw packets directly.

## REST Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/health` | Backend status, version, supported capabilities |
| `GET` | `/interfaces` | List authorized local network interfaces |
| `POST` | `/capture/start` | Start a live capture session |
| `POST` | `/capture/pause` | Pause a capture session |
| `POST` | `/capture/resume` | Resume a paused capture session |
| `POST` | `/capture/stop` | Stop a capture session |
| `GET` | `/sessions` | List capture and PCAP analysis sessions |
| `GET` | `/sessions/{session_id}` | Read capture session metadata |
| `GET` | `/sessions/{session_id}/packets` | Read packet summaries |
| `GET` | `/sessions/{session_id}/flows` | Read flow conversations |
| `GET` | `/sessions/{session_id}/stats` | Read traffic statistics |
| `GET` | `/sessions/{session_id}/dns` | Read DNS records |
| `GET` | `/sessions/{session_id}/http` | Read visible HTTP metadata |
| `GET` | `/sessions/{session_id}/tls` | Read TLS metadata only |
| `GET` | `/sessions/{session_id}/findings` | Read defensive findings |
| `POST` | `/pcap/upload` | Upload PCAP or PCAPNG for parsing |
| `POST` | `/reports/generate` | Generate a defensive Markdown report |
| `GET` | `/reports/{report_id}/download` | Download generated report |

## WebSocket Endpoint

| Path | Purpose |
| --- | --- |
| `/ws/capture/{session_id}` | Stream live packet summaries, statistics deltas, and capture status events |

## Capture Start Request

```json
{
  "interface_id": "eth0",
  "store_raw_packets": false,
  "display_filter": "protocol equals dns",
  "max_packets": 10000
}
```

## Packet Summary Event

```json
{
  "type": "packet.summary",
  "session_id": "session_01J...",
  "packet": {
    "number": 42,
    "timestamp": "2026-04-25T08:42:00.000Z",
    "source_address": "192.168.1.20",
    "destination_address": "8.8.8.8",
    "protocol": "DNS",
    "length": 92,
    "info": "Standard query A example.com"
  }
}
```

## Redaction Policy

The backend must redact sensitive values before returning decoded fields to the dashboard.

Headers and fields to redact include:

- `Authorization`
- `Cookie`
- `Set-Cookie`
- `Proxy-Authorization`
- `X-API-Key`
- token-like fields
- session identifiers
- password-like fields

TLS traffic is metadata only. The backend must not attempt TLS decryption or secret extraction.
