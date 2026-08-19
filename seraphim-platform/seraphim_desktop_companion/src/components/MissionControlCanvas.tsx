import { useSeraphim } from "../state/SeraphimState";

function formatObservationTime(value?: string): string {
  if (!value) {
    return "No bridge observation in this session";
  }

  return `Observed ${new Date(value).toLocaleTimeString()}`;
}

function statusNarrative(status: string): string {
  switch (status) {
    case "online":
      return "The read-only local bridge health endpoint responded during the most recent check.";
    case "degraded":
      return "The local bridge responded outside its expected health condition; capabilities are not assumed.";
    case "offline":
      return "The local bridge is not currently reachable. The canvas stays available as a fixture-backed review surface.";
    default:
      return "The local bridge has not established an observable health state in this session.";
  }
}

export function MissionControlCanvas() {
  const {
    approvals,
    bridgeHealth,
    bridgePairing,
    nextRecommendedAction,
    riskPosture,
    settings,
    tasks
  } = useSeraphim();

  const pendingApprovals = approvals.filter((approval) => approval.status === "pending");
  const activeTasks = tasks.filter((task) => task.status !== "complete").slice(0, 3);
  const blockedTasks = tasks.filter((task) => task.status === "blocked").length;
  const waitingTasks = tasks.filter((task) => task.status === "waiting_for_approval").length;

  return (
    <div className="mission-control" aria-label="Mission Control canvas">
      <section className="mission-control-hero" aria-labelledby="mission-control-title">
        <div className="mission-control-hero-copy">
          <div className="mission-control-kicker">MISSION CONTROL · OBSERVATION ONLY</div>
          <h2 id="mission-control-title">Current operational picture</h2>
          <p>
            A compact review of the present Desktop Companion fixture state and its latest local bridge health
            observation. This canvas cannot approve, pair, write, execute, or alter Runtime state.
          </p>
        </div>

        <div className="mission-control-status-stack" aria-label="Mission Control source labels">
          <span className="mission-source-chip fixture">FIXTURE-BACKED REVIEW DATA</span>
          <span className={`mission-source-chip ${bridgeHealth.status}`}>
            BRIDGE {bridgeHealth.status.toUpperCase()}
          </span>
          <span className="mission-source-chip pending">EXECUTION DISABLED</span>
        </div>
      </section>

      <section className="mission-metric-grid" aria-label="Operational metrics">
        <article className="mission-metric-card">
          <span className="mission-metric-label">OPEN TASKS</span>
          <strong>{activeTasks.length}</strong>
          <span>{blockedTasks > 0 ? `${blockedTasks} flagged blocked` : "No blocked fixture task"}</span>
        </article>
        <article className="mission-metric-card">
          <span className="mission-metric-label">PENDING REVIEW</span>
          <strong>{pendingApprovals.length}</strong>
          <span>{waitingTasks > 0 ? `${waitingTasks} task(s) waiting` : "Fixture approval queue"}</span>
        </article>
        <article className="mission-metric-card">
          <span className="mission-metric-label">RISK POSTURE</span>
          <strong className={`mission-metric-risk ${riskPosture}`}>{riskPosture.toUpperCase()}</strong>
          <span>Derived from current local fixture state</span>
        </article>
        <article className="mission-metric-card">
          <span className="mission-metric-label">BRIDGE OBSERVATION</span>
          <strong className={bridgeHealth.status}>{bridgeHealth.status.toUpperCase()}</strong>
          <span>{formatObservationTime(bridgeHealth.lastCheckedAt)}</span>
        </article>
      </section>

      <section className="mission-observation-grid" aria-label="Mission and source observations">
        <article className="mission-readout-card mission-priority-readout">
          <div className="mission-card-heading">
            <span className="mission-card-label">NEXT REVIEW PROMPT</span>
            <span className="mission-card-state">NON-EXECUTING</span>
          </div>
          <p>{nextRecommendedAction}</p>
          <div className="mission-detail-line">
            <span>WORKSPACE</span>
            <strong>{settings.defaultWorkspace || "Not configured"}</strong>
          </div>
        </article>

        <article className="mission-readout-card">
          <div className="mission-card-heading">
            <span className="mission-card-label">LOCAL BRIDGE HEALTH</span>
            <span className={`bridge-status ${bridgeHealth.status}`}>{bridgeHealth.status.toUpperCase()}</span>
          </div>
          <p>{statusNarrative(bridgeHealth.status)}</p>
          <div className="mission-detail-line">
            <span>ENDPOINT</span>
            <strong>{bridgeHealth.endpoint}</strong>
          </div>
          <div className="mission-detail-line">
            <span>PAIRING</span>
            <strong>{bridgePairing.status === "mock_paired" ? "Mock pairing only" : "No pairing"}</strong>
          </div>
        </article>

        <article className="mission-readout-card mission-contract-readout">
          <div className="mission-card-heading">
            <span className="mission-card-label">RUNTIME DATA CONTRACT</span>
            <span className="mission-card-state">G2-04 STATE CONTRACT PENDING</span>
          </div>
          <p>
            This isolated UI branch has no live G2-04 Runtime-data contract. It does not infer live, partial,
            stale, malformed, permission, or mock Runtime states from fixture content.
          </p>
          <div className="mission-detail-line">
            <span>DISPLAY SOURCE</span>
            <strong>Desktop Companion fixture + bridge health only</strong>
          </div>
        </article>
      </section>

      <section className="mission-queue" aria-labelledby="mission-queue-title">
        <div className="mission-queue-header">
          <div>
            <span className="mission-card-label">MISSION LAYER</span>
            <h3 id="mission-queue-title">Active fixture queue</h3>
          </div>
          <span className="mission-queue-note">READ-ONLY SUMMARY</span>
        </div>

        {activeTasks.length === 0 ? (
          <p className="mission-empty-state">No active fixture tasks are available for this review surface.</p>
        ) : (
          <div className="mission-task-list">
            {activeTasks.map((task) => (
              <article className="mission-task-row" key={task.id}>
                <div className={`mission-task-signal ${task.status}`} aria-hidden="true" />
                <div>
                  <h4>{task.title}</h4>
                  <p>{task.nextAction}</p>
                </div>
                <span className={`mission-task-status ${task.status}`}>{task.status.replaceAll("_", " ")}</span>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
