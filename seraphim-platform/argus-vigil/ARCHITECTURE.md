# Seraphim NetScope Web Architecture

## Architecture Rule

Seraphim NetScope Web is a **browser based dashboard plus local capture backend**.

- The browser handles authorization acknowledgment, visualization, filtering, searching, learning mode, reporting, and analyst interaction.
- The local or server side backend handles packet capture, PCAP parsing, protocol decoding, flow aggregation, statistics, findings, exports, and storage.

Browsers cannot directly capture raw packets from a network interface because they are sandboxed for security. All interface access must go through the authorized backend.

## Components

### Web Dashboard

The React dashboard provides:

- First launch authorization screen
- Backend status detection
- PCAP upload workflow
- Packet table
- Packet details tree
- Hex and ASCII view
- Display filter and search UI
- Traffic statistics
- Conversation flow view
- DNS, HTTP, and TLS metadata panels
- Defensive findings panel
- Markdown report export
- Optional beginner learning explanations

### Local Capture Backend

The backend is a Python 3.11 FastAPI service. It provides:

- `GET /health`
- `GET /interfaces`
- Capture session control endpoints
- PCAP and PCAPNG upload parsing
- Packet summary and protocol layer APIs
- Flow, DNS, HTTP, TLS, stats, findings, and reports APIs
- `/ws/capture/{session_id}` for live packet summary streaming

Packet capture adapters can use Scapy, PyShark, TShark, or libpcap bindings. Windows capture requires Npcap. Linux capture requires libpcap permissions.

## Data Flow

### PCAP Analysis Mode

1. User acknowledges authorization notice.
2. User uploads a `.pcap` or `.pcapng` file.
3. Backend stores a capture session record.
4. Backend parses packet metadata and protocol layers.
5. Backend persists summaries, decoded fields, flows, DNS, HTTP, TLS metadata, statistics, and findings.
6. Dashboard requests session data through REST endpoints.
7. User exports Markdown, CSV, JSON, or selected PCAP artifacts.

### Local Live Capture Mode

1. Dashboard checks `/health`.
2. Dashboard loads `/interfaces`.
3. User chooses an interface they are authorized to inspect.
4. Dashboard starts a capture session.
5. Backend captures packets and streams summaries over WebSocket.
6. Dashboard updates packet table, stats, flows, and findings.
7. Raw payload storage remains disabled unless explicitly enabled.

## Defensive Boundaries

The module only supports defensive, educational, and troubleshooting workflows.

Allowed:

- Authorized packet capture
- PCAP upload and analysis
- Protocol metadata decoding
- Defensive findings
- Reporting and learning explanations

Disallowed:

- Credential harvesting
- Covert interception
- Packet injection attacks
- ARP spoofing
- Man in the middle tooling
- Exploit delivery
- Malware support
- Evasion or stealth capture

## First MVP Milestone

The first milestone is a working dashboard shell with:

- Authorization acknowledgment
- Backend health status
- Start backend instructions
- PCAP upload placeholder workflow
- Packet table layout
- Packet details and hex panels
- Right side statistics and defensive findings

The backend scaffold exists separately so Python capture and PCAP parsing can be built without coupling raw packet access to the browser.
