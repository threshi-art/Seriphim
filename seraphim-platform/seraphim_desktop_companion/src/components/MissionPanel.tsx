import {
  cinematicFixtureInsight,
  cinematicIntelligenceFeed,
  cinematicSensorStates
} from "../data/cinematicContextFixtures";
import { useSeraphim } from "../state/SeraphimState";
import { IntelligenceFeed } from "./IntelligenceFeed";
import { SensorStateTiles } from "./SensorStateTiles";
import { SeraphimInsightCard } from "./SeraphimInsightCard";

function formatActiveView(view: string): string {
  return view.replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatBridgeFreshness(value?: string): string {
  if (!value) {
    return "NOT OBSERVED THIS SESSION";
  }

  return `OBSERVED ${new Date(value).toLocaleTimeString()}`;
}

export function MissionPanel() {
  const {
    activeView,
    approvals,
    bridgeHealth,
    nextRecommendedAction,
    riskPosture,
    settings,
    tasks
  } = useSeraphim();

  const pendingApprovals = approvals.filter((approval) => approval.status === "pending").length;
  const blockedTasks = tasks.filter((task) => task.status === "blocked").length;

  return (
    <aside className="mission-panel cinematic-context-pane" aria-label="Seraphim Context and Intelligence Pane">
      <header className="context-pane-header">
        <div>
          <span className="context-pane-eyebrow">SERAPHIM CONTEXT</span>
          <h2>Current situation</h2>
        </div>
        <span className="context-source-label fixture">READ-ONLY</span>
      </header>

      <section className="context-situation-card" aria-label="Current situation overview">
        <div className="context-situation-row">
          <span>CURRENT VIEW</span>
          <strong>{formatActiveView(activeView)}</strong>
        </div>
        <div className="context-situation-row">
          <span>LOCAL BRIDGE OBSERVATION</span>
          <strong className={`bridge-status ${bridgeHealth.status}`}>{bridgeHealth.status.toUpperCase()}</strong>
        </div>
        <div className="context-situation-row">
          <span>SOURCE FRESHNESS</span>
          <strong>{formatBridgeFreshness(bridgeHealth.lastCheckedAt)}</strong>
        </div>
        <p>
          This pane adapts to the active Desktop Companion view and existing local fixture state. It does not infer
          live Runtime data or duplicate the pending G2-04 Runtime-state contract.
        </p>
      </section>

      <SeraphimInsightCard insight={cinematicFixtureInsight} />

      <section className="context-risk-card" aria-labelledby="context-risk-title">
        <div className="context-card-header">
          <div>
            <span className="context-kicker">RISKS / CONTRADICTIONS</span>
            <h3 id="context-risk-title">Observed review conditions</h3>
          </div>
          <span className="context-source-label fixture">FIXTURE</span>
        </div>
        <div className="context-risk-list">
          <div>
            <span>RISK POSTURE</span>
            <strong className={`risk-${riskPosture}`}>{riskPosture.toUpperCase()}</strong>
          </div>
          <div>
            <span>FIXTURE REVIEW QUEUE</span>
            <strong>{pendingApprovals} pending approval(s)</strong>
          </div>
          <div>
            <span>BLOCKED FIXTURE TASKS</span>
            <strong>{blockedTasks}</strong>
          </div>
          <div>
            <span>RUNTIME CONTRADICTION FEED</span>
            <strong className="unavailable-text">NOT CONNECTED</strong>
          </div>
        </div>
      </section>

      <section className="context-recommendation-card" aria-labelledby="context-recommendation-title">
        <span className="context-kicker">RECOMMENDED NEXT ACTION</span>
        <h3 id="context-recommendation-title">Fixture-derived review prompt</h3>
        <p>{nextRecommendedAction}</p>
        <span className="context-source-label fixture">FIXTURE</span>
      </section>

      <section className="context-open-loops-card" aria-labelledby="context-open-loops-title">
        <div className="context-card-header">
          <div>
            <span className="context-kicker">OPEN LOOPS</span>
            <h3 id="context-open-loops-title">Runtime source unavailable</h3>
          </div>
          <span className="context-source-label unavailable">NOT CONNECTED</span>
        </div>
        <p>
          No durable Runtime open-loop source is connected. The visible fixture queue above is not represented as a
          live mission or approval record.
        </p>
      </section>

      <IntelligenceFeed entries={cinematicIntelligenceFeed} />
      <SensorStateTiles sensors={cinematicSensorStates} />

      <footer className="context-provenance">
        <div>
          <span>WORKSPACE</span>
          <strong>{settings.defaultWorkspace || "NOT CONFIGURED"}</strong>
        </div>
        <div>
          <span>AUTHORITY</span>
          <strong>NO APPROVAL, FILE, EXECUTION, OR RUNTIME ACTION PATH</strong>
        </div>
      </footer>
    </aside>
  );
}
