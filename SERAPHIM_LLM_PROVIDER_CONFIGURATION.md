# Seraphim LLM Provider Configuration

## Active Configuration

**Active provider:** Manus Forge (default fallback). No external API credential is required for the current deployment.

The provider router reads `SERAPHIM_LLM_PROVIDER` only when it is explicitly configured. Accepted selections are `manus-forge`, `openai`, and `anthropic`. If an external provider is selected without its credential, Seraphim logs a non-sensitive availability warning and falls back to the first available provider—Manus Forge in the managed deployment.

| Provider | Required variables | Current validation status |
|---|---|---|
| Manus Forge | Platform-provided Forge URL and key | **VERIFIED** by existing runtime path and mocked fallback test |
| OpenAI | `SERAPHIM_LLM_PROVIDER=openai`, `OPENAI_API_KEY`; optional `OPENAI_API_BASE`, `OPENAI_MODEL` | **PENDING CREDENTIALS**; adapter request construction and fallback are unit-tested |
| Anthropic | `SERAPHIM_LLM_PROVIDER=anthropic`, `ANTHROPIC_API_KEY`; optional `ANTHROPIC_API_URL`, `ANTHROPIC_MODEL` | **PENDING CREDENTIALS**; adapter response normalization and fallback are unit-tested |

## Safe Activation Procedure

1. Add the selected provider variable and matching key through managed project secrets.
2. Restart or redeploy the application through the normal project workflow.
3. Run a controlled chat, EiRAM deep-analysis, and InsightForge request.
4. Confirm that no credentials appear in logs, audit rows, reports, or browser responses.
5. Retain Manus Forge as the recovery provider until the external provider has passed live validation.

## Known Limitation

Live external-provider requests are intentionally not executed in this project until Chris supplies a valid external credential. Seraphim does not fabricate credentials or create paid accounts.
