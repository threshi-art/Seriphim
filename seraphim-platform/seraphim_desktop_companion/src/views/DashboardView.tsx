import { useSeraphim } from "../state/SeraphimState";
import { RiskBadge, RiskLevelBadge } from "../components/RiskBadge";

export function DashboardView() {
  const {
    settings,
    approvals,
    tasks,
    bridgeHealth,
    riskPosture,
    nextRecommendedAction,
    setActiveView
  } = useSeraphim();

  const pending = approvals.filter((item) => item.status === "pending").length;

  return (
    <section className="view">
      <header className="view-header">
        <div>
          <h1>Dashboard</h1>
          <p>Operational status board. Mock execution only; judgments include explicit confidence.</p>
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
          <div className="label">Pending Approvals</div>
          <div className="big-number">{pending}</div>
        </article>
        <article className="card">
          <div className="label">Open Tasks</div>
          <div className="big-number">{tasks.length}</div>
        </article>
      </div>

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
          <button type="button" className="secondary-button" onClick={() => setActiveView("documentation")}>
            Documentation
          </button>
        </div>
      </div>
    </section>
  );
}
