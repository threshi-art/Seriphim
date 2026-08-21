import { DESKTOP_NAV_ITEMS } from "../config/navigation";
import { useSeraphim } from "../state/SeraphimState";
import { DESKTOP_NAV_GROUPS } from "../config/navigation";

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
        {DESKTOP_NAV_GROUPS.map((group) => (
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
