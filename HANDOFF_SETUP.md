# Seraphim Repository Handoff

All commands below are relative to a local clone. In PowerShell, first move to the clone and then enter the platform directory:

```powershell
Set-Location <path-to-your-clone>
Set-Location seraphim-platform
```

## Platform

Requirements: Node.js 24, pnpm 10.4.1, and Python 3.12.

```powershell
pnpm install --frozen-lockfile
pnpm verify
pnpm bridge:test
pnpm dev:win
```

The local bridge remains read-only and requires an explicitly approved workspace:

```powershell
$env:SERAPHIM_BRIDGE_WORKSPACE_ROOT = (Resolve-Path ".").Path
pnpm bridge:dev
```

## EI-RAM engine

From the repository root:

```powershell
Set-Location app-portfolio\03_EIRAM_Analysis_Studio\engine-api
python -m unittest discover -s tests -p "test_*.py"
python -m uvicorn app.main:app --reload
```

EI-RAM is a deterministic, evidence-bounded text-analysis prototype. Its outputs are not diagnosis, identity inference, or ground truth.

## Desktop Companion

From `seraphim-platform` on Windows with the .NET 9 SDK installed:

```powershell
pnpm desktop:build
pnpm verify:desktop-publish
```

The desktop build regenerates its bundled `repo-docs` tree from canonical platform sources. Do not edit or commit that generated tree.
