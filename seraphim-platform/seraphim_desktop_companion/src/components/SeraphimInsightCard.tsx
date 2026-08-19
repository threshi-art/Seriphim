import type { SeraphimInsightFixture } from "../data/cinematicContextFixtures";

interface SeraphimInsightCardProps {
  insight: SeraphimInsightFixture;
}

export function SeraphimInsightCard({ insight }: SeraphimInsightCardProps) {
  return (
    <section className="seraphim-insight-card" aria-labelledby="seraphim-insight-title">
      <div className="context-card-header">
        <div>
          <span className="context-kicker">SERAPHIM INSIGHT</span>
          <h3 id="seraphim-insight-title">{insight.title}</h3>
        </div>
        <span className="context-source-label fixture">{insight.sourceClassification}</span>
      </div>

      <p className="seraphim-insight-summary">{insight.summary}</p>

      <dl className="seraphim-insight-facts">
        <div>
          <dt>CONFIDENCE</dt>
          <dd>{insight.confidence}</dd>
        </div>
        <div>
          <dt>IMPACT</dt>
          <dd className={`impact-${insight.impact.toLowerCase()}`}>{insight.impact}</dd>
        </div>
        <div>
          <dt>SOURCES</dt>
          <dd>{insight.sourceCount}</dd>
        </div>
        <div>
          <dt>FRESHNESS</dt>
          <dd>{insight.freshness}</dd>
        </div>
      </dl>

      <div className="seraphim-insight-caveat">
        <span>CONTRADICTIONS</span>
        <p>{insight.contradictions}</p>
      </div>
      <div className="seraphim-insight-action">
        <span>RECOMMENDED NEXT ACTION</span>
        <p>{insight.recommendedNextAction}</p>
      </div>
    </section>
  );
}
