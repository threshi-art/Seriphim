type DispatchDecision = "QUEUED" | "DUPLICATE" | "BLOCKED";

const fixtureLedger: Array<{
  correlationId: string;
  mission: string;
  decision: DispatchDecision;
  evidenceRef: string;
  circuit: "CLOSED" | "OPEN";
}> = [
  {
    correlationId: "fixture-mission-001",
    mission: "Validate governed runtime contract",
    decision: "QUEUED",
    evidenceRef: "fixture://queued/fixture-mission-001",
    circuit: "CLOSED",
  },
  {
    correlationId: "fixture-mission-001",
    mission: "Validate governed runtime contract",
    decision: "DUPLICATE",
    evidenceRef: "fixture://dedupe/fixture-mission-001",
    circuit: "CLOSED",
  },
  {
    correlationId: "fixture-mission-002",
    mission: "Request unapproved external action",
    decision: "BLOCKED",
    evidenceRef: "fixture://blocked/fixture-mission-002",
    circuit: "OPEN",
  },
];

function decisionClass(decision: DispatchDecision) {
  return decision === "QUEUED" ? "success" : decision === "DUPLICATE" ? "pending" : "danger";
}

export function SentinelControlView() {
  return (
    <section className="view" aria-labelledby="sentinel-control-title">
      <header className="view-header">
        <div>
          <p className="eyebrow">SENTINEL / CONTROL PLANE PROOF</p>
          <h1 id="sentinel-control-title">Mission Control Ledger</h1>
          <p>SIMULATED / FIXTURE ONLY — no live dispatch, credential, tunnel, filesystem, or process authority.</p>
        </div>
        <span className="status-pill pending">PRESENTATION ONLY</span>
      </header>

      <p className="warning-box">
        This dashboard displays deterministic fixture outcomes from the isolated Sentinel control-plane proof. It cannot send a task, wake Manus, call an API, mutate a file, or alter a system state.
      </p>

      <div className="card-grid">
        <article className="card">
          <div className="card-topline"><strong>Mission queue</strong><span className="status-pill success">1 queued</span></div>
          <p className="muted">Admission is correlation-bound. Repeated instructions resolve to deduplication evidence rather than a second simulated dispatch.</p>
        </article>
        <article className="card">
          <div className="card-topline"><strong>Circuit posture</strong><span className="status-pill danger">guarded</span></div>
          <p className="muted">A disallowed fixture proves fail-closed blocking. The control plane records the decision; it never substitutes its judgment for an approved action.</p>
        </article>
        <article className="card">
          <div className="card-topline"><strong>Evidence ledger</strong><span className="status-pill pending">3 fixtures</span></div>
          <p className="muted">Every displayed outcome retains a correlation identifier and immutable-looking fixture evidence reference for review.</p>
        </article>
      </div>

      <div className="card" style={{ marginTop: "1rem" }}>
        <div className="card-topline"><strong>Fixture dispatch ledger</strong><span className="status-pill pending">NO EXTERNAL ACTION</span></div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Correlation</th><th>Mission</th><th>Decision</th><th>Circuit</th><th>Evidence</th></tr></thead>
            <tbody>
              {fixtureLedger.map((entry, index) => (
                <tr key={`${entry.correlationId}-${index}`}>
                  <td>{entry.correlationId}</td><td>{entry.mission}</td>
                  <td><span className={`status-pill ${decisionClass(entry.decision)}`}>{entry.decision}</span></td>
                  <td>{entry.circuit}</td><td><code>{entry.evidenceRef}</code></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
