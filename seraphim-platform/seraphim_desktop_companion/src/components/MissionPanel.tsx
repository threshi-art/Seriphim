import { useSeraphim } from "../state/SeraphimState";
import { RiskBadge, RiskLevelBadge } from "./RiskBadge";

export function MissionPanel() {
  const {
    settings,
    approvals,
    plan,
    bridgeHealth,
    riskPosture,
    nextRecommendedAction
  } = useSeraphim();

  const pendingApprovals = approvals.filter((approval) => approval.status === "pending");

  return (
    <aside className="mission-panel">
      <h2>Mission Panel</h2>

      <section className="panel-card">
        <div className="label">Workspace</div>
        <div className="value">
          {settings.defaultWorkspace || "No workspace selected"}
        </div>
      </section>

      <section className="panel-card">
        <div className="label">Safety Mode</div>
        <RiskBadge safetyLevel={settings.safetyMode} />
      </section>

      <section className="panel-card">
        <div className="label">Risk Posture</div>
        <RiskLevelBadge riskLevel={riskPosture} />
      </section>

      <section className="panel-card">
        <div className="label">Local Bridge</div>
        <div className={`bridge-status ${bridgeHealth.status}`}>
          {bridgeHealth.status.toUpperCase()}
        </div>
        <div className="muted">{bridgeHealth.endpoint}</div>
      </section>

      <section className="panel-card">
        <div className="label">Pending Approvals</div>
        <div className="big-number">{pendingApprovals.length}</div>
      </section>

      <section className="panel-card">
        <div className="label">Current Plan</div>
        <ol className="plan-list">
          {plan.map((item) => (
            <li key={item.id}>
              <strong>{item.title}</strong>
              <span>{item.status}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="panel-card">
        <div className="label">Next Recommended Action</div>
        <div className="value">{nextRecommendedAction}</div>
      </section>
    </aside>
  );
}
