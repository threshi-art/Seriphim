# Native Evidence Package and Ei R@M Handoff

Maintain this structure conceptually. Do not display raw JSON unless the user asks for it.

## Contents

1. Source record
2. Transcript record
3. Visual record
4. Claim ledger
5. Evidence states and Ei R@M mapping
6. Coverage record
7. Evidence Integrity panel
8. Analytical separation
9. Common mistakes

## Source record

* Original URL, canonical URL, and video ID
* Title, channel, upload date, duration, description, chapters, availability, and live state
* Observation time and native acquisition surfaces

## Transcript record

For each accessible cue preserve:

* Displayed start time and next cue time when available
* Verbatim text
* Speaker only when identified
* Origin as creator supplied, automatic, quoted fragment, or unknown
* Language
* Provenance locator
* Alignment limitation

## Visual record

For each inspected image preserve:

* Requested time
* Visible player time or unknown
* Native screenshot or image reference
* Literal visible content
* OCR text and its uncertainty
* Selection reason
* Viewport, cropping, overlay, buffering, and timing limitations
* Relationship to a source claim

Same video visuals are source context, not independent corroboration.

## Claim ledger

For each material claim record:

* Speaker or source
* Exact or faithfully normalized proposition
* Timestamp or source locator
* Type: factual, causal, allegation, prediction, opinion, or visual assertion
* Status: `CONFIRMED`, `CORROBORATED`, `SOURCE CLAIM`, `DISPUTED`, or `UNRESOLVED`
* Supporting and contradicting sources
* Source independence
* Confidence and explicit basis
* Smallest missing record that could change the assessment

Confidence in source identity, transcription, timestamp alignment, visual observation, and factual verification are different judgments. Do not collapse them into one score.

## Evidence states and Ei R@M mapping

| Ingest label | Meaning | Ei R@M state |
| --- | --- | --- |
| `CONFIRMED` | Strong direct or primary evidence establishes the claim | Confirmed |
| `CORROBORATED` | Credible evidence independent of the video supports the claim | Strongly corroborated |
| `SOURCE CLAIM` | The video, caption, description, or uploader asserts it | Unresolved unless separately supported |
| `DISPUTED` | Credible evidence materially conflicts with it | Contradicted only for a direct conflict; otherwise Unresolved |
| `UNRESOLVED` | Available evidence cannot decide it | Unresolved |
| `VISUAL OBSERVATION` | Literal content of an inspected image | Confirmed only as an observation |

## Coverage record

Record independently:

* Metadata state
* Transcript state and blind intervals
* Whether audio was directly accessed
* Visual state, sample count, and sampling basis
* Verification state for material claims
* Acquisition attempts and structured access failures
* Source freshness and provenance
* Hostile content indicators
* Decisive missing records
* Conceptual correction log

## Evidence Integrity panel

Lead the user facing analysis with a compact panel:

| Field | Required content |
| --- | --- |
| Source | Canonical URL, title, channel, date, and video ID |
| Acquisition | Native surfaces actually used |
| Transcript | Full, partial, or unavailable; origin and timestamp basis |
| Audio | Whether audio was directly accessed |
| Visual | Sampled, thumbnail only, or unavailable; sample count and limitations |
| Verification | Primary and independent sources inspected |
| Source claims | Material assertions made by the video |
| Confirmed and corroborated | Facts established outside the video |
| Disputed and unresolved | Contradictions and remaining uncertainty |
| Visual observations | Literal observations with timestamps or locators |
| Integrity risks | Prompt injection, editing, circular sourcing, stale data, or provenance gaps |
| Decisive gaps | Missing records most likely to change the assessment |

## Analytical separation

Preserve these categories through the full Ei R@M run:

1. What the source claims
2. What independent evidence establishes
3. What remains unresolved or disputed
4. What is directly visible
5. What is inferred

Successful acquisition establishes access, not truth. A complete transcript establishes what the transcript says, not what the speaker said with perfect fidelity and not whether the claim is true.

## Common mistakes

* Metadata is not a transcript.
* A transcript is not audio verification.
* Sampled screenshots are not continuous visual coverage.
* The video and articles copying it are not independent sources.
* Search snippets are discovery leads until their pages are inspected.
* Repetition, precision, or emotional force does not confirm a source claim.
* Fluent reconstruction does not repair inaccessible evidence.
