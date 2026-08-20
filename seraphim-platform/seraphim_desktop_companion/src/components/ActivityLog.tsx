import { useSeraphim } from "../state/SeraphimState";

export function ActivityLog() {
  const { activityLog } = useSeraphim();
  const visibleEvents = activityLog.slice(0, 6);

  return (
    <footer className="activity-log cinematic-activity-log" aria-label="Local operator activity stream">
      <div className="activity-log-header">
        <div>
          <span className="activity-log-kicker">LOCAL UI EVENT LOG</span>
          <strong>Operational stream</strong>
        </div>
        <span className="activity-log-source">READ-ONLY SUMMARY</span>
      </div>
      <div className="activity-log-items" aria-live="polite">
        {visibleEvents.length === 0 ? (
          <div className="activity-log-empty">
            No local UI events are present. Runtime audit events remain separately gated.
          </div>
        ) : (
          visibleEvents.map((event) => (
            <div key={event.id} className={`activity-item ${event.level}`}>
              <span className="activity-time">{new Date(event.createdAt).toLocaleTimeString()}</span>
              <span>{event.message}</span>
            </div>
          ))
        )}
      </div>
    </footer>
  );
}
