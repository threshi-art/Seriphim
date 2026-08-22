# G2-04 Native Windows Validation Checklist

> **PREPARED, NOT YET EXECUTED.** This checklist is bound to draft PR [#104](https://github.com/threshi-art/Seriphim/pull/104) at commit `43398c42614c589a5682b059297096bfa02b24c2`, plus any later reviewed G2-04-only repair commit. It is not evidence of a successful Windows build or paired smoke test.

## Required Software and Preconditions

| Item | Required condition | Failure behavior |
|---|---|---|
| Repository | Canonical Windows clone is clean except the checked-out PR #104 worktree, and its `origin` resolves to `threshi-art/Seriphim`. | Stop. Do not overwrite unrelated work. |
| Node and package manager | Node, Corepack, and the repository-pinned pnpm are available. | Stop if frozen install fails; do not relax the lockfile. |
| Native toolchain | A Windows x64 .NET 9 SDK is listed by `dotnet --list-sdks`. | Stop; do not claim native build evidence. |
| Python | `py -3.13` can import `seraphim_runtime`. | Stop; do not use an unreviewed interpreter. |
| Runtime identity | The operator selects a non-secret `RUNTIME_OWNER_ID` that matches the local Runtime records to observe. | Stop; do not guess owner scope. |
| Safety state | No production file mutation or external execution setting is enabled. | Stop and investigate any affirmative capability. |

## 1. Repository and Toolchain Preflight

Run from the canonical repository root, then enter `seraphim-platform`.

```powershell
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$repo = (Get-Location).Path
if (-not (Test-Path -LiteralPath (Join-Path $repo 'seraphim-platform'))) {
  throw 'Run this preflight from the canonical Seriphim repository root.'
}
Set-Location $repo
git fetch origin --prune
git status --short
git rev-parse HEAD
git rev-parse origin/agent/g2-04-live-desktop-state
git remote get-url origin

Set-Location "$repo\seraphim-platform"
node --version
npm --version
corepack --version
corepack pnpm --version
dotnet --list-sdks
py -3.13 --version
```

Expected: the selected PR commit equals the reviewed G2-04 head; Git status is clean; .NET reports a 9.x SDK; no command reports an unavailable tool. Any mismatch is a stop condition and must be attached as failure evidence.

## 2. Frozen Verification and Native Build

```powershell
corepack pnpm install --frozen-lockfile
corepack pnpm verify
corepack pnpm bridge:test
corepack pnpm desktop:build
corepack pnpm verify:desktop-publish
```

Expected: `verify` and `bridge:test` pass, `desktop:build` emits `One-click Desktop Companion ready`, and `verify:desktop-publish` finds `dist\desktop\SeraphimDesktopCompanion.exe` plus `wwwroot\index.html`. The build script may refresh generated `dist\desktop` output but must not create Runtime database or SQLite sidecar files in the repository or OneDrive source tree.

## 3. Paired Read-only Runtime Service

The following starts the existing **read-only** Runtime API and provisions the native host’s DPAPI-protected profile. It prints a pairing identifier and expiry only; it must never print plaintext credential material. Set the owner deliberately—do not use the fixture identifier from automated tests.

```powershell
$env:SERAPHIM_RUNTIME_OWNER_ID = '<operator-selected-runtime-owner-id>'
$env:SERAPHIM_RUNTIME_BRIDGE_ID = $env:COMPUTERNAME
py -3.13 -m seraphim_runtime.desktop_runtime_service `
  --owner-id $env:SERAPHIM_RUNTIME_OWNER_ID `
  --bridge-id $env:SERAPHIM_RUNTIME_BRIDGE_ID `
  --provision-pairing --serve
```

Expected: the service states that it provisioned `%LOCALAPPDATA%\Seraphim\Runtime\desktop-runtime-pairing.json` and is serving `http://127.0.0.1:8765/`. The profile is expected to contain only `endpoint`, owner, pairing, origin, bridge, expiry, and `credential_protected`; the browser/WebView must never render it.

Failure behavior: absent or invalid `LOCALAPPDATA`, non-Windows DPAPI, unsafe database override, invalid owner, or malformed profile must fail closed. Do not alter the profile manually to bypass an error.

## 4. Desktop Paired Smoke

In a second PowerShell window:

```powershell
corepack pnpm desktop:open
```

Confirm in the Desktop Companion:

1. The left banner changes from `RUNTIME UNAVAILABLE` to `RUNTIME LIVE • EXECUTION DISABLED` after **Refresh Runtime**.
2. Dashboard reports `LIVE`, `READ_ONLY`, `LOOPBACK_ONLY`, no file writes, and no external execution.
3. Mission, task, approval, attempt, and audit cards show the paired owner’s data—or an explicitly live empty observation—not mock fixtures.
4. Runtime approval records show no Approve or Reject controls.
5. The Local Bridge view exposes no token or credential preview.
6. Stop the Runtime process, use **Refresh Runtime**, and confirm `OFFLINE` before a snapshot or `STALE` after a previously observed snapshot.
7. Restore the Runtime process, refresh, and confirm recovery to `LIVE`.

Malformed-response behavior is exercised by the committed `runtimeState.test.ts` contract test. Do not replace the trusted Runtime endpoint with an untrusted service simply to produce a malformed manual response.

## 5. Evidence Capture

Capture, without secrets, the output from sections 1–3, the native publish output, screenshots of live/offline/stale state, and the exact PR commit. Attach sanitized evidence to PR #104 and update `G2-04_IMPLEMENTATION_EVIDENCE.md` only after successful execution.

| Evidence | Approved location |
|---|---|
| Build and verification output | Sanitized PR comment or evidence Markdown in the G2-04 branch. |
| Desktop screenshots | PR attachment; do not include credential profile content. |
| Runtime pairing profile | `%LOCALAPPDATA%\Seraphim\Runtime\desktop-runtime-pairing.json`; inspect metadata only, never commit or attach it. |
| WebView profile and local logs | `%LOCALAPPDATA%\Seraphim\DesktopCompanion\WebView2`; do not relocate into the repository or OneDrive. |

## 6. Storage Contamination Scan

Run after the service and Desktop Companion exit. This scans only the canonical repository and the active OneDrive SeraphimGPT source boundary; it does not inspect unrelated user data.

```powershell
$sourceBoundary = $env:SERAPHIM_SOURCE_BOUNDARY
if ([string]::IsNullOrWhiteSpace($sourceBoundary)) {
  throw 'Set SERAPHIM_SOURCE_BOUNDARY to the active Seraphim source boundary before running this scoped scan.'
}
$sourceBoundary = (Resolve-Path -LiteralPath $sourceBoundary -ErrorAction Stop).Path
Get-ChildItem -LiteralPath $repo, $sourceBoundary -Recurse -Force -File -ErrorAction Stop |
  Where-Object { $_.Name -match '\.(db|sqlite|sqlite3)$|-(journal|wal|shm)$' } |
  Select-Object FullName, Length, LastWriteTime
```

Expected: no new Runtime database or SQLite sidecar appears under the canonical repository or active source boundary. Any unexpected in-scope result is a failed validation condition; preserve its metadata, do not delete unrelated files, and do not merge PR #104.
