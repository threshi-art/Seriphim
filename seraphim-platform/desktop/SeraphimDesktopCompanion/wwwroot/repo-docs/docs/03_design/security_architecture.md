# Security Architecture

## Trust Boundaries

| Boundary | Trust |
|----------|-------|
| Web server | Trusted app code; secrets in env |
| Browser web UI | Semi-trusted; no secrets |
| Desktop UI | Semi-trusted; no secrets in localStorage |
| Local bridge | Trusted local service; localhost only |
| Mobile | Semi-trusted; approval channel only |
| LLM output | Untrusted for authorization decisions |

## Controls

- Localhost bind for bridge
- Workspace allowlist
- Approval gates
- Audit logs
- No secret persistence in desktop storage
- Prompt injection treated as untrusted input
