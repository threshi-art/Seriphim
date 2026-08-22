import { DESKTOP_NAV_ITEMS } from "../config/navigation";
import { useSeraphim } from "../state/SeraphimState";

export function LeftNav() {
  const { activeView, setActiveView, runtimeData } = useSeraphim();

  return (
    <aside className="left-nav">
      <div className="brand">
        <div className="brand-mark">S</div>
        <div>
          <div className="brand-title">Seraphim</div>
          <div className="brand-subtitle">Desktop Companion</div>
        </div>
      </div>

      <div className="mock-banner">
        {runtimeData.snapshot ? `RUNTIME ${runtimeData.phase.toUpperCase()} • EXECUTION DISABLED` : "RUNTIME UNAVAILABLE • EXECUTION DISABLED"}
      </div>

      <nav>
        {DESKTOP_NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={activeView === item.id ? "nav-button active" : "nav-button"}
            onClick={() => setActiveView(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </aside>
  );
}
