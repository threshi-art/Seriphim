# Seraphim versioning

Operator-facing running version and change history for the whole repository.

## Files

| File | Purpose |
|------|---------|
| `VERSION.json` | Canonical version, status, last edit, verification snapshot |
| `CHANGELOG.md` | Human-readable running change log (Keep a Changelog style) |

Formal configuration-management records remain in `docs/05_configuration/change_control_log.md` (CCL IDs). This folder is the **fast operator index** — open it first for “what version are we on?” and “what changed lately?”

## Update policy

1. **On every material change** — append a line to `CHANGELOG.md` under `[Unreleased]` and run:

   ```powershell
   pnpm versioning:refresh
   ```

2. **pnpm store** — project uses `store-dir=.pnpm-store` in `.npmrc`. If `pnpm install` reports a store mismatch, run once:

   ```powershell
   $env:CI = "true"
   pnpm install
   ```

   Do **not** add Playwright for walkthroughs; use `pnpm walkthrough:desktop` (HTTP harness).

2. **With a one-line summary** (also sets `lastEditSummary`):

   ```powershell
   pnpm versioning:refresh -- --summary "Short description of what changed"
   ```

3. **After verification** (refreshes test/publish status from `pnpm verify:full`):

   ```powershell
   pnpm versioning:refresh -- --verify
   ```

4. **Regular interval** — weekly or at end of each work session:

   ```powershell
   pnpm versioning:refresh -- --verify
   ```

   In Cursor you can schedule this with `/loop 7d pnpm versioning:refresh -- --verify` if you want an automated reminder tick.

## AI agents

Per `AGENTS.md`, agents should update `versioning/CHANGELOG.md` and run `pnpm versioning:refresh` when landing operator-approved batches, and mirror significant entries in `docs/05_configuration/change_control_log.md`.
