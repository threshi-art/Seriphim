# Native YouTube and Chrome Acquisition

Use this workflow before third party transcript bridges whenever the current ChatGPT surface exposes page context, Browser, Chrome, screenshots, or the user's actual YouTube session.

## 1. Establish source identity

1. Accept `youtube.com`, `www.youtube.com`, `m.youtube.com`, `music.youtube.com`, or `youtu.be` over HTTPS.
2. Extract the video ID from `/watch?v=`, `youtu.be/`, `/shorts/`, `/live/`, or `/embed/`. Also accept a bare 11-character video ID.
3. Normalize to `https://www.youtube.com/watch?v=VIDEO_ID` while preserving the original URL.
4. Record title, channel, upload date, duration, description, chapters, availability, and live state when directly exposed.
5. Mark missing metadata unknown rather than inferring it.

## 2. Acquire transcript through the user's YouTube page

Use this order:

1. Timestamped transcript already supplied by current page context.
2. Open the canonical watch page in the user's Chrome or Browser session.
3. Prefer complete timestamped caption data already exposed by the loaded page.
4. Otherwise expand the description and activate `Show transcript` or the current equivalent.
5. Read the transcript from the visible or accessibility DOM until no new timestamped rows appear.

Support both known YouTube transcript interfaces:

* Current rows: `macro-markers-panel-item-view-model`. Accessible rows may contain a timestamp, spoken-time label, and segment text.
* Legacy rows: `ytd-transcript-segment-renderer`. Read each segment and timestamp.

A visible transcript search field or close control is evidence that the panel opened, but not proof that transcript rows populated.

Do not rely only on the legacy engagement panel `visibility` attribute. Current rows can exist in the visible accessibility tree even when an older panel reports hidden.

Do not treat the player label `Subtitles/closed captions unavailable` as proof that no transcript exists. Auto-dubbed and multi-audio videos can expose transcript text elsewhere on the page.

## 3. Bounded browser retry

If the transcript control appears but rows do not populate:

1. Wait for the page and metadata to finish loading.
2. Perform one clean retry, such as reopening the transcript panel or reloading the watch page once.
3. Inspect the current transcript row elements explicitly rather than trusting one general DOM snapshot.
4. If timestamped rows still do not appear, classify the result as `browser transcript population failure` and move immediately to `fallback-acquisition.md`.

Do not burn repeated attempts on the same browser state.

## 4. Traverse completely

For long or dynamically loaded transcripts, continue scrolling or reading until no new timestamped rows appear.

Before a whole-video summary, verify:

* first timestamp is near the beginning,
* final timestamp reasonably approaches known duration,
* language and caption origin are recorded when exposed.

A partial transcript is not sufficient for a whole-video conclusion.

## 5. Timestamp links

For grounded answers, convert strong transcript moments into clickable links:

`https://youtu.be/VIDEO_ID?t=SECONDS`

Use a few precise timestamps rather than many weak citations.

## 6. Visual evidence

Inspect the thumbnail and current player view when possible. For visual claims sample:

* opening and closing views,
* chapter boundaries,
* evenly spaced anchors,
* material claims dependent on charts, documents, maps, names, figures, edits, or demonstrations.

Record literal visual observations separately from transcript claims. Same-video visuals are source context, not independent corroboration.

If the player is blocked by an advertisement, blank canvas, buffering, or unchanged frame after one clean retry, mark the limitation and continue with transcript evidence.

## 7. Public trace recovery

When direct context is incomplete, search exact video ID, exact title, title plus channel, distinctive transcript phrases, and material named entities. Inspect underlying pages before relying on them.

## 8. Stop conditions

Stop native acquisition when the transcript is complete or the bounded browser retry has failed. Continue through `fallback-acquisition.md` rather than looping.

## 9. Adaptive visual sampling

When player seeking and screenshots are available, prefer claim-driven sampling over fixed intervals.

1. Sample timestamps where the speaker says `as you can see`, references a chart, document, map, code, image, number, or demonstration.
2. Sample chapter boundaries and material scene transitions.
3. Use evenly spaced anchors only to fill unexplained visual gaps.
4. Record the frame timestamp and literal observation separately from interpretation.

When the current environment already exposes scene-change detection, use it to identify high-information frames. Do not require local software installation from the user.

## 10. Description and citation harvesting

For investigative work, inspect the description and pinned source references when exposed. Extract links to papers, articles, official records, datasets, or documents as leads. Fetch the underlying source independently before treating it as support.

Record the video's upload date so claims can be evaluated against the state of the world at publication time and, when relevant, against the current state.

## 11. Conversation reuse

Once a complete video record is acquired in the current conversation, reuse it for follow-up questions. Reacquire only if the earlier record was partial, another language or caption track is needed, or the user asks for fresh metadata or comments.
