import { useSeraphim } from "../state/SeraphimState";

export function LogsView() {
  const { activityLog, clearLogs } = useSeraphim();

  return (
    <section className="view">
      <header className="view-header">
        <div>
          <h1>Logs</h1>
          <p>Timestamped local activity events persisted in localStorage.</p>
        </div>
        <button type="button" className="secondary-button" onClick={clearLogs}>
          Clear
        </button>
      </header>

      <div className="card">
        {activityLog.length === 0 ? (
          <p className="muted">No log events.</p>
        ) : (
          activityLog.map((event) => (
            <div key={event.id} className={`activity-item ${event.level}`}>
              <span className="muted">{new Date(event.createdAt).toLocaleString()}</span>
              <span>{event.message}</span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
