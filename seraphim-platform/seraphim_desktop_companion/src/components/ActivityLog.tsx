import { useSeraphim } from "../state/SeraphimState";

export function ActivityLog() {
  const { activityLog, clearLogs } = useSeraphim();

  return (
    <footer className="activity-log">
      <div className="activity-log-header">
        <strong>Activity Log</strong>
        <button type="button" className="secondary-button" onClick={clearLogs}>
          Clear
        </button>
      </div>
      <div className="activity-log-items">
        {activityLog.length === 0 ? (
          <div className="muted">No events yet.</div>
        ) : (
          activityLog.slice(0, 20).map((event) => (
            <div key={event.id} className={`activity-item ${event.level}`}>
              <span className="muted">
                {new Date(event.createdAt).toLocaleTimeString()}
              </span>
              <span>{event.message}</span>
            </div>
          ))
        )}
      </div>
    </footer>
  );
}
