import { useSeraphim } from "../state/SeraphimState";
import { RiskBadge } from "../components/RiskBadge";

export function TasksView() {
  const { tasks, runtimeData, refreshRuntimeData } = useSeraphim();

  return (
    <section className="view">
      <header className="view-header">
        <div>
          <h1>Tasks</h1>
          <p>{runtimeData.snapshot ? `Runtime ${runtimeData.phase} task projection. Read-only observation only.` : "Explicit mock task fixtures; paired Runtime data is unavailable."}</p>
        </div>
        <button type="button" onClick={() => void refreshRuntimeData()}>Refresh Runtime</button>
      </header>

      <div className="card-grid">
        {runtimeData.detail && <p className="warning-box">{runtimeData.detail}</p>}
        {tasks.map((task) => (
          <article key={task.id} className="card">
            <div className="card-topline">
              <RiskBadge safetyLevel={task.safetyLevel} />
              <span className={`status-pill ${task.status === "blocked" ? "rejected" : "pending"}`}>
                {task.status}
              </span>
            </div>
            <h2>{task.title}</h2>
            <p>{task.description}</p>
            <div className="detail-row">
              <span>Next action</span>
              <strong>{task.nextAction}</strong>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
