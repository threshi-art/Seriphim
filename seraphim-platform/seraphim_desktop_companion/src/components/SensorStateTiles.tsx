import type { SensorStateFixture } from "../data/cinematicContextFixtures";

interface SensorStateTilesProps {
  sensors: readonly SensorStateFixture[];
}

export function SensorStateTiles({ sensors }: SensorStateTilesProps) {
  return (
    <section className="sensor-state-section" aria-labelledby="sensor-state-title">
      <div className="context-card-header">
        <div>
          <span className="context-kicker">SENSORS / CAMERAS</span>
          <h3 id="sensor-state-title">Source availability</h3>
        </div>
        <span className="context-source-label unavailable">NO LIVE SOURCES</span>
      </div>

      <div className="sensor-state-grid">
        {sensors.map((sensor) => (
          <article className={`sensor-state-tile ${sensor.status.toLowerCase().replaceAll(" ", "-")}`} key={sensor.id}>
            <div className="sensor-preview" aria-hidden="true">
              <span>{sensor.status}</span>
            </div>
            <div className="sensor-state-copy">
              <div>
                <strong>{sensor.id}</strong>
                <span>{sensor.location}</span>
              </div>
              <span className="sensor-preview-label">{sensor.previewLabel}</span>
              <span className="context-source-label compact">{sensor.sourceClassification}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
