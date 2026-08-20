import type { IntelligenceFeedFixture } from "../data/cinematicContextFixtures";

interface IntelligenceFeedProps {
  entries: readonly IntelligenceFeedFixture[];
}

export function IntelligenceFeed({ entries }: IntelligenceFeedProps) {
  return (
    <section className="intelligence-feed" aria-labelledby="intelligence-feed-title">
      <div className="context-card-header">
        <div>
          <span className="context-kicker">LIVE INTELLIGENCE FEED</span>
          <h3 id="intelligence-feed-title">Compact source queue</h3>
        </div>
        <span className="context-source-label unavailable">FIXTURE / NOT CONNECTED</span>
      </div>

      <p className="context-capability-note">
        No live intelligence feed source is connected. Entries below are source-labelled presentation fixtures.
      </p>

      <div className="intelligence-feed-list">
        {entries.slice(0, 3).map((entry) => (
          <article className="intelligence-feed-item" key={entry.id}>
            <div className="feed-item-meta">
              <span>{entry.timestamp}</span>
              <span className={`importance-${entry.importance.toLowerCase()}`}>{entry.importance}</span>
            </div>
            <strong>{entry.headline}</strong>
            <div className="feed-item-footer">
              <span>{entry.source}</span>
              <span>{entry.category}</span>
              <span className="context-source-label compact">{entry.sourceClassification}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
