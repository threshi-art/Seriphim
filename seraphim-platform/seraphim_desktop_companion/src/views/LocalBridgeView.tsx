import { useSeraphim } from "../state/SeraphimState";

export function LocalBridgeView() {
  const {
    bridgeHealth,
    refreshBridgeHealth,
    runtimeData,
    refreshRuntimeData,
    settings
  } = useSeraphim();

  return (
    <section className="view">
      <header className="view-header">
        <div>
          <h1>Local Bridge</h1>
          <p>Bridge health plus paired Runtime observation. Execution and file mutation remain disabled.</p>
        </div>
        <div className="button-row">
          <button type="button" onClick={() => void refreshBridgeHealth()}>Check Bridge</button>
          <button type="button" className="secondary-button" onClick={() => void refreshRuntimeData()}>Refresh Runtime</button>
        </div>
      </header>

      <div className="card">
        <h2>Bridge Status</h2>
        <div className={`bridge-status ${bridgeHealth.status}`}>
          {bridgeHealth.status.toUpperCase()}
        </div>

        <div className="detail-row">
          <span>Configured endpoint</span>
          <strong>{settings.bridgeEndpoint}</strong>
        </div>
        <div className="detail-row">
          <span>Last health target</span>
          <strong>{bridgeHealth.endpoint}</strong>
        </div>
        <div className="detail-row">
          <span>Last checked</span>
          <strong>{bridgeHealth.lastCheckedAt ?? "Never"}</strong>
        </div>
        {bridgeHealth.version && (
          <div className="detail-row">
            <span>Version</span>
            <strong>{bridgeHealth.version}</strong>
          </div>
        )}

        <div className="pairing-box">
          <h3>Runtime Pairing and Read Access</h3>
          <div className="detail-row">
            <span>Read state</span>
            <strong>{runtimeData.phase}</strong>
          </div>
          {runtimeData.observedAt && (
            <div className="detail-row">
              <span>Last Runtime observation</span>
              <strong>{runtimeData.observedAt}</strong>
            </div>
          )}
          <p className="muted">
            Credentials remain in the native Windows broker and are never rendered, placed in localStorage, or exposed to WebView content. A missing, expired, or revoked pairing remains fail-closed.
          </p>
          {runtimeData.detail && <p className="warning-box">{runtimeData.detail}</p>}
        </div>

        <h3>Bridge Capabilities</h3>
        <ul>
          {bridgeHealth.capabilities.map((capability) => (
            <li key={capability}>{capability}</li>
          ))}
        </ul>

        <p className="warning-box">
          Runtime reads are limited to signed GET requests on 127.0.0.1:8765. The Desktop does not open SQLite, create Runtime records, decide approvals, write files, delete files, or execute commands.
          Port map: Runtime 8765, local-agent 8767 (legacy Red), workspace bridge 8768.
        </p>
      </div>
    </section>
  );
}
