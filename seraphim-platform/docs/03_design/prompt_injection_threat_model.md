# Prompt Injection Threat Model

## Threats

- Untrusted file content instructs agent to run shell
- Web page / news content attempts approval bypass
- Memory entries poisoned with tool directives

## Mitigations

- Tool authorization is code-enforced, not prompt-enforced
- Approvals required for Yellow/Red regardless of model text
- Untrusted content treated as data, not instructions
- Future bridge ignores model-provided commands without approval tokens
