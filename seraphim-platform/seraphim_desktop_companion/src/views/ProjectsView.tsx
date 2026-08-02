import { useSeraphim } from "../state/SeraphimState";

export function ProjectsView() {
  const { projects, settings } = useSeraphim();

  return (
    <section className="view">
      <header className="view-header">
        <div>
          <h1>Projects</h1>
          <p>Tracked program surfaces. Active workspace is operator-selected text only in MVP.</p>
        </div>
      </header>

      <div className="card">
        <div className="label">Active Workspace Path</div>
        <div className="value">{settings.defaultWorkspace || "Not set"}</div>
      </div>

      <div className="card-grid">
        {projects.map((project) => (
          <article key={project.id} className="card">
            <div className="card-topline">
              <strong>{project.name}</strong>
              <span className="status-pill pending">{project.status}</span>
            </div>
            <div className="detail-row">
              <span>Path</span>
              <strong>{project.path}</strong>
            </div>
            <p className="muted">{project.notes}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
