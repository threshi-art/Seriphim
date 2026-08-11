# Contributing

Seriphim is a curated portfolio repository, not an unrestricted research dump.
Contributions should improve a bounded component, its verification evidence, or
the shared architecture without overstating maturity.

## Before Opening a Pull Request

1. State the component and user-facing outcome.
2. Separate source, generated output, samples, and local runtime data.
3. Add or update focused tests for behavior changes.
4. Preserve conservative labels such as prototype, scaffold, and placeholder.
5. Document new dependencies, external services, and required configuration.
6. Confirm that every asset has a redistribution basis and provenance record.
7. Run the narrowest relevant verification plus any component-level suite.

## Do Not Commit

- credentials, tokens, `.env` files, private keys, or local account data;
- machine-specific paths or personal workspace inventories;
- raw ChatGPT conversations, personal memory, or psychological dossiers;
- clinical instruments or copyrighted/restricted reference libraries;
- third-party media without documented rights;
- dependency folders, build outputs, archives, logs, or captured runtime data;
- installable Skill packages that have not passed the publication gate in
  `skills/README.md`.

## Pull Request Description

Explain what changed, why it belongs in the repository, its maturity, the
verification performed, known limitations, and any deferred follow-up. A
successful local command is not evidence of a supported production deployment.

Security-sensitive findings should follow `SECURITY.md`, not a public pull
request or issue.
