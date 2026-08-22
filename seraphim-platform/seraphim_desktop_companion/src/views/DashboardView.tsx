import { MissionControlCanvas } from "../components/MissionControlCanvas";

export function DashboardView() {
  return (
    <section className="view mission-control-view">
      <header className="view-header mission-control-view-header">
        <div>
          <span className="eyebrow">COMMAND CENTER</span>
          <h1>Mission Control</h1>
          <p>
            A dominant, source-labelled situation canvas. It renders available Desktop Companion observations only;
            it does not provide a control path for Runtime, approvals, pairing, file changes, or execution.
          </p>
        </div>
      </header>

      <MissionControlCanvas />
    </section>
  );
}
