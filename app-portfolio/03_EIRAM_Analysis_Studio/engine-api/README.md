# EI-RAM Phase-1 Engine

EI-RAM is a modular narrative and ideological-analysis prototype.

This is a Phase-1 starter build: rule-based feature extraction and module
scoring wrapped in a FastAPI service with JSON output and audit-friendly
intermediate fields.

The scores are deterministic heuristics. They are not validated measures of a
person's beliefs, intent, dangerousness, mental state, legal status, or future
behavior, and they must not be used as the sole basis for consequential
decisions.

## Quick start

From the `eiram API/` directory:

```bash
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

Then call:

```bash
curl -X POST http://127.0.0.1:8000/analyze \
  -H "Content-Type: application/json" \
  -d "{\"text\":\"We are being betrayed and we need to fight back against these enemies.\"}"
```

You can also generate public-profile search leads:

```bash
curl -X POST http://127.0.0.1:8000/research-handle \
  -H "Content-Type: application/json" \
  -d "{\"handle\":\"jack\",\"platform\":\"x\"}"
```

Public-profile research uses ordinary public web queries and guessed direct
profile URLs. It does not authenticate to social platforms, bypass access
controls, or retrieve private content. Results require human verification.

## Desktop command deck

EiRAM now also includes a PearlFuel-inspired desktop shell that drives the
engine directly while leaving the FastAPI service intact.

Install desktop dependencies:

```bash
python -m pip install -r requirements-desktop.txt
```

Launch the desktop shell:

```bash
python run_desktop.py
```

The desktop command deck includes:

- Pearl-style dark glass interface with cards, chips, and tabs
- direct narrative intake wired to the existing `run_eiram()` engine
- a public handle research tab for `x`, `instagram`, `linkedin`, and more
- raw request/report panes for quick audit and export

## Tests

```bash
pytest -q
```

## Build a double-click .exe (Windows)

This bundles a server launcher (`run_server.py`) with PyInstaller.

1. Install PyInstaller:
   ```powershell
   python -m pip install -r requirements-dev.txt
   ```
2. Build:
   ```powershell
   pyinstaller --onefile --noconsole --name "EiRAM_Server" run_server.py
   ```
3. Output:
   - `dist\EiRAM_Server.exe`

Double-click `dist\EiRAM_Server.exe`, then open:
- `http://127.0.0.1:8000/docs`

The server writes logs to `logs\eiram_server.log` inside this `engine-api/`
folder.

## Portfolio status

- Phase-1 deterministic prototype
- FastAPI and direct-engine paths implemented
- Desktop shell implemented but not validated across clean machines
- Two focused unit tests imported from the source workspace
- Predictive validity, calibration, fairness, and domain suitability unvalidated

See [PROVENANCE.md](PROVENANCE.md) for the curated-import boundary.
