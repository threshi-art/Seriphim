import { CINEMATIC_VIEW_CONTEXT } from "../config/navigation";
import type { ActiveView } from "../state/SeraphimState";

export function SpecialistViewHeader({ activeView }: { activeView: ActiveView }) {
  if (activeView === "dashboard") {
    return null;
  }

  const context = CINEMATIC_VIEW_CONTEXT[activeView];
  return (
    <section className="specialist-view-header" aria-label={`${context.title} destination context`}>
      <div>
        <span className="eyebrow">{context.group} / SPECIALIST DESTINATION</span>
        <strong>{context.title}</strong>
        <p>{context.summary}</p>
      </div>
      <div className="specialist-view-header-signals" aria-label="Destination safety posture">
        <span className="status-signal">VIEW-SCOPED CONTEXT</span>
        <span className="status-signal execution-disabled">PRESENTATION ONLY</span>
      </div>
    </section>
  );
}
