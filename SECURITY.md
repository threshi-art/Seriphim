# Security Policy

## Supported Scope

This repository is a portfolio snapshot containing active, prototype, and
placeholder components. No component should be assumed production-supported
unless a release explicitly says so.

Security reports are welcome for tracked source, especially:

- local-bridge workspace escape or permission bypass;
- credential or personal-data exposure;
- unsafe command execution;
- authentication or authorization defects;
- prompt-injection paths that can trigger tools or external effects;
- dependency or build-pipeline compromise.

## Reporting

Use the repository's GitHub **Security** tab and **Report a vulnerability**
workflow when available. Do not place credentials, exploit details, private
data, or sensitive local paths in a public issue.

If private vulnerability reporting is unavailable, contact the repository
owner through GitHub with a non-sensitive summary and request a private channel
before sending technical details.

Include the affected path or commit, impact, reproduction conditions, and any
safe mitigation you identified. Reports concerning third-party services should
also follow the provider's disclosure process.

## Boundaries

Do not test against systems, accounts, people, or data you do not own or have
explicit authorization to assess. Do not upload live secrets or personal data
as proof.
