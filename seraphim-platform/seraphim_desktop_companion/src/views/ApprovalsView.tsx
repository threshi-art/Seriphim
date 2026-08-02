import { useSeraphim } from "../state/SeraphimState";
import { RiskBadge } from "../components/RiskBadge";

export function ApprovalsView() {
  const { approvals, approveRequest, rejectRequest } = useSeraphim();

  return (
    <section className="view">
      <header className="view-header">
        <div>
          <h1>Approvals</h1>
          <p>Yellow and Red actions require operator approval. MVP does not execute them.</p>
        </div>
      </header>

      <div className="card-grid">
        {approvals.map((approval) => (
          <article key={approval.id} className="card">
            <div className="card-topline">
              <RiskBadge safetyLevel={approval.safetyLevel} />
              <span className={`status-pill ${approval.status}`}>{approval.status}</span>
            </div>

            <h2>{approval.title}</h2>
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

            {approval.status === "pending" && (
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
          </article>
        ))}
      </div>
    </section>
  );
}
