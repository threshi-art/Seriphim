import { DESKTOP_NAV_ITEMS } from "../config/navigation";
import { useSeraphim, type ActiveView } from "../state/SeraphimState";

const GROUPS: ReadonlyArray<{ label: string; ids: readonly ActiveView[] }> = [
  { label: "COMMAND", ids: ["dashboard", "chat", "projects"] },
  { label: "OPERATIONS", ids: ["tasks", "approvals", "files", "memory"] },
  { label: "SYSTEM", ids: ["local_bridge", "sentinel", "logs", "settings", "documentation"] }
];

export function LeftNav() {
  const { activeView, setActiveView } = useSeraphim();

  return (
    <aside className="left-nav">
      <div className="brand">
        <div className="brand-mark" aria-hidden="true">⌁</div>
        <div>
          <div className="brand-title">Seraphim</div>
          <div className="brand-subtitle">Command Interface</div>
        </div>
      </div>

      <div className="mock-banner">EXECUTION DISABLED · REVIEW MODE</div>

      <nav aria-label="Desktop destinations">
        {GROUPS.map((group) => (
          <section className="nav-group" key={group.label} aria-label={group.label}>
            <div className="nav-group-label">{group.label}</div>
            {group.ids.map((id) => {
              const item = DESKTOP_NAV_ITEMS.find((candidate) => candidate.id === id);
              if (!item) return null;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={activeView === item.id ? "nav-button active" : "nav-button"}
                  aria-current={activeView === item.id ? "page" : undefined}
                  onClick={() => setActiveView(item.id)}
                >
                  <span className="nav-button-marker" aria-hidden="true" />
                  {item.label}
                </button>
              );
            })}
          </section>
        ))}
      </nav>
    </aside>
  );
}
