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

Public-profile research accepts a bounded public handle and a supported
platform, then uses ordinary public web queries and guessed direct profile
URLs. It does not authenticate to social platforms, bypass access controls,
retrieve private content, establish identity, or infer personal traits.
Results require human verification.

## Governed Seraphim proof mission

`POST /proof-missions` executes one deterministic architecture proof: Seraphim
opens a governed EiRAM case, runs two synthetic collectors, evaluates competing
hypotheses, permits one Red Team-requested supplemental collection, audits
claim-level APA/exhibit citations, and returns one structured assessment.

```bash
curl -X POST http://127.0.0.1:8000/proof-missions \
  -H "Content-Type: application/json" \
  -d '{"original_request":"What does this fictional slogan mean, and is the repetition coordinated?","operator_designated_significance":true}'
```

The bundled evidence is entirely fictional and synthetic. The proof performs
no live collection, monitoring, network access, account identification, or
external write. Its SQLite Shared Case Ledger is local and inspectable at
`data/proof-mission.sqlite3` by default; set `EIRAM_PROOF_DB` to use another
local path. A successful result demonstrates the v0.1 architecture—it does not
authorize external action, public release, or broader surveillance.

The normative boundary is
[`SERAPHIM_ARCHITECTURE_CONTRACT_V0_1.md`](../../../docs/architecture/SERAPHIM_ARCHITECTURE_CONTRACT_V0_1.md).

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

The interface's legacy `risk_vector` field is retained for compatibility. Its
values describe configured textual cue density only; they are not a person-level
risk assessment or behavioral prediction. Every analysis response includes
explicit limitations.

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
- Governed deterministic proof mission and persistent case ledger implemented
- Predictive validity, calibration, fairness, and domain suitability unvalidated
- input length and public-handle syntax are bounded at the API schema
- search failures are reported without exposing internal exception details

See [PROVENANCE.md](PROVENANCE.md) for the curated-import boundary.
