import { useSeraphim } from "../state/SeraphimState";

export function SentinelView() {
  const { sentinelChecks } = useSeraphim();

  return (
    <section className="view">
      <header className="view-header">
        <div>
          <h1>SystemSentinel</h1>
          <p>
            {sentinelChecks.length} health checks catalogued. SIMULATED / REQUIRES BRIDGE — not executed.
          </p>
        </div>
      </header>

      <p className="warning-box">
        PowerShell scripts exist under SystemSentinel/scripts in the web monorepo, but this cockpit does not run them.
      </p>

      <div className="card-grid">
        {sentinelChecks.map((check) => (
          <article key={check.id} className="card">
            <div className="card-topline">
              <strong>{check.name}</strong>
              <span className="status-pill pending">{check.executionStatus}</span>
            </div>
            <div className="detail-row">
              <span>Category</span>
              <strong>{check.category}</strong>
            </div>
            <div className="detail-row">
              <span>Script</span>
              <strong>{check.scriptName}</strong>
            </div>
            <p className="muted">{check.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
