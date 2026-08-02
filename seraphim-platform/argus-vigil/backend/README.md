# Argus Vigil Backend

This folder contains the Python 3.11 FastAPI backend scaffold for Seraphim NetScope Web.

The backend is responsible for all packet and PCAP access. The browser dashboard must never attempt direct raw packet capture.

## Local Development

```powershell
cd argus-vigil/backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8765
```

Then open the Seraphim web app and go to `/argus-vigil`.

## Platform Notes

- Windows live capture requires Npcap.
- Linux live capture requires libpcap and appropriate interface permissions.
- PCAP upload analysis can run without live interface capture privileges.

## Safety Rules

- Capture only on systems and networks the user owns, administers, or is explicitly authorized to inspect.
- Do not implement packet injection, ARP spoofing, man in the middle workflows, credential harvesting, stealth capture, malware support, exploit delivery, or evasion.
- Do not store sensitive payloads by default.
