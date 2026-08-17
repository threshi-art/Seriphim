import { useSeraphim } from "../state/SeraphimState";
import { RiskBadge, RiskLevelBadge } from "../components/RiskBadge";

export function DashboardView() {
  const {
    settings,
    approvals,
    tasks,
    bridgeHealth,
    runtimeData,
    refreshRuntimeData,
    riskPosture,
    nextRecommendedAction,
    setActiveView
  } = useSeraphim();

  const pending = approvals.filter((item) => item.status === "pending").length;
  const runtimeSnapshot = runtimeData.snapshot;
  const runtimeAttempts = runtimeSnapshot?.attempts.length ?? 0;
  const runtimeAuditValid = runtimeSnapshot
    ? Object.values(runtimeSnapshot.auditHealthByMissionId).every((item) => item.valid) && runtimeSnapshot.health.auditChainValid
    : null;

  return (
    <section className="view">
      <header className="view-header">
        <div>
          <h1>Dashboard</h1>
          <p>Operational status board. Runtime observation is GET-only; file mutation and execution remain disabled.</p>
        </div>
      </header>

      <div className="card-grid">
        <article className="card">
          <div className="label">Workspace</div>
          <div className="value">{settings.defaultWorkspace || "Not set"}</div>
        </article>
        <article className="card">
          <div className="label">Safety Mode</div>
          <RiskBadge safetyLevel={settings.safetyMode} />
        </article>
        <article className="card">
          <div className="label">Risk Posture</div>
          <RiskLevelBadge riskLevel={riskPosture} />
        </article>
        <article className="card">
          <div className="label">Bridge</div>
          <div className={`bridge-status ${bridgeHealth.status}`}>
            {bridgeHealth.status.toUpperCase()}
          </div>
        </article>
        <article className="card">
          <div className="label">Runtime Data</div>
          <div className={`bridge-status ${runtimeData.phase === "live" ? "online" : runtimeData.phase === "partial" || runtimeData.phase === "stale" ? "degraded" : "offline"}`}>
            {runtimeData.phase.toUpperCase()}
          </div>
          <small>{runtimeData.observedAt ? `Observed ${runtimeData.observedAt}` : runtimeData.detail ?? "No Runtime data observed."}</small>
        </article>
        <article className="card">
          <div className="label">Pending Approvals</div>
          <div className="big-number">{pending}</div>
        </article>
        <article className="card">
          <div className="label">Open Tasks</div>
          <div className="big-number">{tasks.length}</div>
        </article>
        <article className="card">
          <div className="label">Runtime Missions</div>
          <div className="big-number">{runtimeSnapshot?.missions.length ?? "—"}</div>
        </article>
        <article className="card">
          <div className="label">Runtime Attempts</div>
          <div className="big-number">{runtimeSnapshot ? runtimeAttempts : "—"}</div>
        </article>
        <article className="card">
          <div className="label">Audit Health</div>
          <div className={`bridge-status ${runtimeAuditValid === true ? "online" : runtimeAuditValid === false ? "offline" : "degraded"}`}>
            {runtimeAuditValid === null ? "UNOBSERVED" : runtimeAuditValid ? "VALID" : "INVALID"}
          </div>
        </article>
      </div>

      {runtimeSnapshot && (
        <div className="card">
          <div className="label">Runtime Mission Observation</div>
          {runtimeSnapshot.missions.length > 0 ? (
            runtimeSnapshot.missions.map((mission) => (
              <div key={mission.missionId} className="detail-row">
                <span>{mission.title}</span>
                <strong>{mission.status}</strong>
              </div>
            ))
          ) : (
            <p className="muted">The paired Runtime reported no owner-scoped missions.</p>
          )}
          {runtimeData.detail && <p className="warning-box">{runtimeData.detail}</p>}
        </div>
      )}

      <div className="card">
        <h2>Next Action</h2>
        <p>{nextRecommendedAction}</p>
        <div className="button-row">
          <button type="button" onClick={() => setActiveView("settings")}>
            Settings
          </button>
          <button type="button" className="secondary-button" onClick={() => setActiveView("approvals")}>
            Approvals
          </button>
          <button type="button" className="secondary-button" onClick={() => void refreshRuntimeData()}>
            Refresh Runtime
          </button>
          <button type="button" className="secondary-button" onClick={() => setActiveView("documentation")}>
            Documentation
          </button>
        </div>
      </div>
    </section>
  );
}
