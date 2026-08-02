# EI-RAM Red Label Prototype

This folder contains a proof-of-design interface for EI-RAM Analysis Studio.

## Status

Developmental red label. This is not production code and is not the final implementation baseline.

## Current Prototype Capabilities

- Paste source text
- Run local mock EI-RAM scoring
- Display summary, module scores, evidence, risk vector, forecast, and limitations
- Save cases to browser localStorage
- Reopen saved cases
- Generate a Markdown report preview

## Open

Open `index.html` directly in a browser.

## Notes

The scoring logic is a local keyword heuristic used only to validate the interface and workflow. The final implementation should replace it with the EI-RAM engine adapter described in the SDD and Data Design Document.
