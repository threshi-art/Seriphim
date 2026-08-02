# Ingestion Notes

## MVP Intake

The MVP should support pasted plain text first.

Why:

- It keeps the analysis pipeline simple.
- It avoids early PDF/DOCX parsing complexity.
- It lets us validate the core workflow quickly.

## Phase 2 Intake

Add local file ingestion:

- `.txt`
- `.md`
- `.pdf`
- `.docx`

## Phase 3 Intake

Add structured sources:

- Public handle research metadata
- Saved web articles
- Case folders
- Batch comparison sets

## Guardrails

- Show source limitations.
- Do not imply certainty beyond available evidence.
- Keep original input accessible for audit.
- Label inferred conclusions clearly.
- Avoid treating a score as a diagnosis or legal conclusion.
