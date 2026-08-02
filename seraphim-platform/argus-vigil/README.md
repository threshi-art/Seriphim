# Argus Vigil

Argus Vigil is the module home for **Seraphim NetScope Web**, a browser based defensive packet analysis platform.

The architecture follows one hard rule:

> Browser based dashboard plus local capture backend.

The browser is the command center for visualization, filtering, learning, reporting, and analyst workflow. The backend is the only component that touches packet captures, network interfaces, PCAP files, protocol decoding, flow aggregation, statistics, and storage.

## Scope

Argus Vigil is designed for lawful, authorized network diagnostics, cybersecurity learning, troubleshooting, and defensive analysis.

It must not include credential theft, stealth capture, unauthorized interception, packet injection attacks, ARP spoofing, man in the middle tooling, exploit delivery, malware support, evasion, or offensive operations.

## Deployment Modes

1. **Local Lab Mode**: the user runs the capture backend locally and the web dashboard connects to `localhost`.
2. **PCAP Analysis Mode**: the user uploads a PCAP or PCAPNG file, and the backend parses metadata, packets, flows, protocol summaries, and defensive findings.
3. **Remote Sensor Mode**: a future authorized sensor streams packet metadata to the dashboard.

## Folder Layout

```text
argus-vigil/
  README.md
  ARCHITECTURE.md
  API.md
  DATABASE_SCHEMA.md
  ARGUS_TERRA.md
  backend/
    README.md
    requirements.txt
    app/
      main.py
```

The existing React application hosts the first dashboard shell at `/argus-vigil`.

## MVP Build Order

1. Backend health check and frontend shell
2. PCAP upload and parsing
3. Packet table
4. Packet details tree
5. Hex view
6. Statistics dashboard
7. Flow conversation view
8. DNS panel
9. HTTP and TLS metadata panels
10. Display filters and search
11. Local interface listing
12. Live capture through local backend
13. WebSocket packet streaming
14. Defensive findings panel
15. Markdown report export

## Privacy Defaults

- Store packet metadata by default.
- Do not store full payloads unless explicitly enabled.
- Redact obvious secrets before display or persistence.
- Warn before saving raw captures.
- Allow permanent session deletion and full local data clearing.
