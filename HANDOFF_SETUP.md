# SeraphimGPT Windows Handoff Setup

This folder contains several local projects. Use these commands from PowerShell.

## 0. Static Preview Fallback

Use this when Node or pnpm are not available yet.

```powershell
cd "C:\Users\cyber\OneDrive\Documents\Projects\Programs\SeraphimGPT\Seraphim"
python preview_server.py
```

Then open:

```text
http://127.0.0.1:4177
```

This preview mirrors the current navigation and dashboard concepts, but it is not the live React app.

## 1. Seraphim Web App

Path:

```powershell
cd "C:\Users\cyber\OneDrive\Documents\Projects\Programs\SeraphimGPT\Seraphim"
```

Required tools:

- Node.js with `node` on `PATH`
- pnpm with `pnpm` on `PATH`

Install and run:

```powershell
pnpm install
pnpm dev
```

Validation:

```powershell
pnpm check
pnpm test
```

Notes:

- The dev/start scripts are Windows-safe and set `NODE_ENV` through `scripts/run-with-node-env.mjs`.
- If `pnpm` is not recognized, install Node.js and enable pnpm through Corepack, or install pnpm globally.

## 2. Argus Vigil Backend

Path:

```powershell
cd "C:\Users\cyber\OneDrive\Documents\Projects\Programs\SeraphimGPT\Seraphim\argus-vigil\backend"
```

Create an environment and run:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8765
```

Then open Seraphim and go to `/argus-vigil`.

## 3. EI-RAM API

Path:

```powershell
cd "C:\Users\cyber\OneDrive\Documents\Projects\Programs\SeraphimGPT\AGI Training\EI-RAM\eiram API"
```

Run:

```powershell
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

Validate:

```powershell
python -m pytest -q
```

## 4. SystemSentinel

Path:

```powershell
cd "C:\Users\cyber\OneDrive\Documents\Projects\Programs\SeraphimGPT\SystemSentinel"
```

Required tools:

- JDK 21+
- `JAVA_HOME` set to the JDK folder

Build:

```powershell
.\scripts\build.ps1
```

Validate:

```powershell
.\mvnw.cmd test
```

The app image output is:

```text
target\exe\SystemSentinel\SystemSentinel.exe
```
