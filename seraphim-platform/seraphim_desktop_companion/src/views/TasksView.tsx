import { useSeraphim } from "../state/SeraphimState";
import { RiskBadge } from "../components/RiskBadge";

export function TasksView() {
  const { tasks } = useSeraphim();

  return (
    <section className="view">
      <header className="view-header">
        <div>
          <h1>Tasks</h1>
          <p>MOCK mission tasks. Status is local UI state only.</p>
        </div>
      </header>

      <div className="card-grid">
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
