# Software Development Plan

## Approach

Small controlled increments. Prefer extension over rewrite. TypeScript for web and desktop UI. Prefer Python FastAPI for future `seraphim_local_bridge` (fits Argus Vigil Python ecosystem). Existing C# launcher may remain for web+agent bootstrap.

## Standards

- Follow existing web conventions when modifying web app
- No inline imports
- Exhaustive switches for discriminated unions
- Zod validation on procedure inputs
- Central LLM helper only for web LLM calls
- Mock features labeled **MOCK** or **SIMULATED**

## Protected Paths

Do not modify unless absolutely necessary:

- `server/_core/*`
- `client/src/components/ui/*`
- `patches/*`
- `drizzle/meta/*`

## Branching / Change Control

Record material changes in `05_configuration/change_control_log.md`. Do not commit secrets.
