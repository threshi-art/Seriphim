---
name: semantic-priority-router
description: Use when a request mixes topics, media, objectives, corrections, or emphasis and the requested operation and primary object must be separated from the carrier modality before selecting a specialist.
---

# Semantic Priority Router

## Overview

Identify what the user wants done and what they want it done to. Treat media
type as an input channel, not automatic ownership of the task.

## Workflow

1. Read the Context Sentinel packet and apply its correction history.
2. Extract the requested operation, primary object, and explicit emphasis.
3. Record carrier modality separately: text, image, video, audio, repository,
   records, or mixed sources.
4. Assess stakes, reversibility, evidence quality, ambiguity, and missing input.
5. Name candidate owners without assigning final primary/support roles.
6. Return the packet defined in `references/routing-packet-contract.md` to
   Seraphim Operator Routing.

Explicit focus outranks modality. "Analyze the video, particularly the
speaker's legal premise" points toward legal analysis; video ingestion remains
an evidence supplier.

If several objects are supplied without a common question, identify a unifying
question. When no safe unifying interpretation exists, return the missing
decision instead of activating every relevant specialist.

## Routing Restraint

Return `direct_response_candidate: true` for simple lookups, transformations,
or ordinary conversation that needs no specialist. Do not perform specialist
analysis, assign final roles, or convert relevance into activation.

## Quick Reference

| Signal | Packet field |
|---|---|
| Verb or requested outcome | `user_operation` |
| Person, claim, artifact, decision, or system | `primary_object` |
| "Focus on," "especially," or correction | `explicit_emphasis` |
| Format carrying the evidence | `carrier_modality` |
| Consequence and reversibility | `consequence_class` |

## Example

Request: "Correction: ignore the production style and analyze the
decision-maker's incentives in this recording."

Set the operation to `analyze incentives`, the object to `decision-maker`, the
emphasis to the correction, and modality to `video`. Do not make video ingestion
the intellectual owner.

## Common Mistakes

- Routing by file type instead of requested judgment.
- Keeping an earlier object after a direct correction.
- Fanning out across every plausible topic.
- Performing the analysis instead of producing a routing packet.
