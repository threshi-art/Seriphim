import { useSeraphim } from "../state/SeraphimState";
import { RiskBadge } from "../components/RiskBadge";

export function ApprovalsView() {
  const { approvals, approveRequest, rejectRequest, runtimeData, refreshRuntimeData } = useSeraphim();

  return (
    <section className="view">
      <header className="view-header">
        <div>
          <h1>Approvals</h1>
          <p>{runtimeData.snapshot ? "Live Runtime approval records are read-only in G2-04. Decision controls remain disabled." : "Explicit mock approval fixtures; no Runtime decision is available."}</p>
        </div>
        <button type="button" onClick={() => void refreshRuntimeData()}>Refresh Runtime</button>
      </header>

      <div className="card-grid">
        {approvals.map((approval) => (
          <article key={approval.id} className="card">
            <div className="card-topline">
              <RiskBadge safetyLevel={approval.safetyLevel} />
              <span className={`status-pill ${approval.status}`}>{approval.status}</span>
            </div>

            <h2>{approval.actionLabel ?? approval.title}</h2>
            <p>{approval.reason}</p>

            <div className="detail-row">
              <span>Target</span>
              <strong>{approval.target}</strong>
            </div>

            {approval.proposedCommand && <pre>{approval.proposedCommand}</pre>}
            {approval.proposedDiff && <pre>{approval.proposedDiff}</pre>}
            {approval.rollbackPlan && (
              <p className="muted">Rollback: {approval.rollbackPlan}</p>
            )}

            {approval.status === "pending" && approval.source !== "runtime" && (
              <div className="button-row">
                <button type="button" onClick={() => approveRequest(approval.id)}>
                  Approve Mock
                </button>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => rejectRequest(approval.id)}
                >
                  Reject
                </button>
              </div>
            )}
            {approval.source === "runtime" && (
              <p className="warning-box">Live Runtime record. G2-04 exposes no approval mutation, file-write, or execution control.</p>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
