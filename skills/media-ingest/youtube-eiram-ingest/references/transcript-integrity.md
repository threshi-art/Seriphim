# Transcript Integrity and Normalization

Apply this gate after transcript acquisition and before whole-video analysis.

## 1. Bind identity

Confirm the returned record is tied to the requested video ID. Preserve title, channel when known, duration, language, and acquisition path. Reject generic landing pages, mismatched titles, cache errors, or unrelated text.

## 2. Check temporal structure

When timestamps exist:

1. Confirm timestamps are nondecreasing.
2. Confirm the first timestamp is near the beginning.
3. Confirm the final timestamp reasonably approaches known video duration.
4. Scan for unusually large internal gaps.
5. Treat a response that ends well before the known duration or ends mid-record as potentially truncated.

Use coverage thresholds as diagnostics, not truth guarantees. A final timestamp near the end does not prove every middle segment is present.

## 3. Detect duplication and corruption

Flag likely mechanical duplication when any of these occur:

* exact phrases repeat two or more times back-to-back within the same timestamp block,
* the same segment text is emitted multiple times with identical timing,
* estimated speech rate is implausibly high for the known duration,
* markup, provider boilerplate, or generator footers are interleaved with speech,
* timestamp order resets unexpectedly without a clear chapter or track boundary.

As a heuristic, sustained effective speech above roughly 300 words per minute should trigger a duplication or corruption check rather than automatic rejection.

## 4. Normalize conservatively

Allowed normalization:

1. Collapse exact adjacent duplicates that share the same timestamp or segment identity.
2. Normalize whitespace and obvious line-wrap artifacts.
3. Remove provider boilerplate outside the transcript body.
4. Preserve timestamp-to-text mapping after cleanup.
5. Preserve non-speech cues such as `[Music]`, `[Applause]`, or speaker labels when useful.

Do not:

* remove repeated speech that occurs at distinct increasing timestamps,
* guess uncertain proper nouns, acronyms, numbers, or quotations,
* merge different speakers merely because their text is similar,
* convert an ASR guess into a clean quotation without verification.

If normalization materially changes transcript length, record `connector duplication artifact` or the narrowest supported reason.

## 5. Caption-track quality

When track metadata is exposed, prefer for evidence work:

1. original-language manually created captions,
2. original-language auto-generated captions,
3. user-requested manually created captions,
4. user-requested auto-generated captions,
5. machine translation only when necessary.

For understanding rather than quotation, a translated track may be acceptable. Preserve the original-language evidence path when a precise quotation or factual term matters.

Record whether the video uses multiple audio tracks or dubbing when exposed. Do not assume a transcript in the user's language represents the creator's original spoken audio.

## 6. Long-video processing

If the transcript is too large for one reliable pass:

1. Prefer structured segments, pagination, or chapter-aware retrieval.
2. Otherwise split the acquired transcript into contiguous windows, normally about 10 to 15 minutes each.
3. For each window, retain timestamp range, summary, material claims, names or terms needing verification, and unresolved gaps.
4. Synthesize only after every window, including the final one, has been processed.
5. If a source truncates before completion, switch to a route that exposes pagination, structured segments, or incremental DOM reading when available.

Never infer the missing remainder from an earlier portion.

## 7. Quality classification

Use one of these conceptual states:

**clean**: identity bound, timing coherent, coverage sufficient, no material artifact detected.

**usable with warnings**: substantially complete but contains correctable duplication, ASR uncertainty, translation, or minor gaps that do not defeat the requested task.

**partial**: meaningful sections are missing, output truncates, or coverage cannot support a whole-video conclusion.

**corrupt**: identity mismatch, severe duplication or timing failure, or content cannot be reliably reconstructed without another source.

Expose the state to the user only when it affects confidence, scope, quotations, or conclusions.
