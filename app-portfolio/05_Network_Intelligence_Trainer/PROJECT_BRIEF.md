# Network Intelligence Trainer

## Mission Statement

Build a networking study and operations trainer for subnetting, OSI troubleshooting, port lookup, command practice, lab simulation, and network design.

## Product Thesis

The Seraphim network intelligence module already looks like a strong school/certification companion and can be made useful without sensitive integrations.

## Proposed Architecture

- Frontend: lab dashboard, subnet calculator, port database, command library, quiz mode, and design workspace.
- Backend: tRPC or FastAPI services for calculators, lab registry, quiz generation, and documentation generation.
- Data: static JSON knowledge bases for ports, commands, labs, and examples.
- LLM layer: guided troubleshooting and design explanations.
- Safety model: training-focused, simulated labs, no real network scanning by default.

## Source Material

- `Seraphim/shared/network-ports.ts`
- `Seraphim/shared/network-commands.ts`
- `Seraphim/shared/network-labs.ts`
- `Seraphim/client/src/pages/dashboard/NetworkIntelPage.tsx`

## MVP Scope

- Subnet calculator
- Common ports table
- Command library
- Lab cards
- Quiz generator

## Open Questions

- Should this target CMIT coursework, CompTIA Network+, Cisco basics, or all of the above?
- Should labs be purely textual or include diagrams?
