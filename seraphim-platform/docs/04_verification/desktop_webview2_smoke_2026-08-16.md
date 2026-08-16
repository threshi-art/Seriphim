# Desktop WebView2 Runtime-Data Smoke Evidence — 2026-08-16

## Provenance

This record preserves the operator attestation supplied in the verified Seraphim handoff on 2026-08-16. It is not a claim that the smoke launch was independently repeated in the isolated documentation worktree.

## Tested Artifact

`%OneDrive%\Documents\Projects\Programs\SeraphimGPT\Seraphim\dist\desktop\SeraphimDesktopCompanion.exe`

## Operator-Attested Procedure and Observations

The rebuilt operator executable was launched as a hidden smoke test after PR #18 was merged. The operator reported that:

1. The executable remained running after launch.
2. WebView2 used `%LOCALAPPDATA%\Seraphim\DesktopCompanion\WebView2`.
3. No `.WebView2` directory was recreated beside the executable in the OneDrive application mirror.
4. The existing WebView2 profile had been moved to the LOCALAPPDATA location without deletion.

## Corroborating Repository Evidence

- PR #18: <https://github.com/threshi-art/Seriphim/pull/18>
- Merge commit: `7e012e0755d88df8ba441060d6dd43a233bc9829`
- Static policy test: `server/desktop-host-policy.test.ts`
- Host implementation: `desktop/SeraphimDesktopCompanion/Program.cs`
- Verification case: `VC-DESK-UDF-001`

## Evidence Classification

Result: **pass (operator-attested smoke; automated policy test and Release build independently reproducible).**

Future release gates must perform and capture a fresh packaged-application smoke test rather than relying solely on this attestation.
