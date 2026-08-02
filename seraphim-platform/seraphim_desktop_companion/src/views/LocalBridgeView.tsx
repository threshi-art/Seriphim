import { useSeraphim } from "../state/SeraphimState";

export function LocalBridgeView() {
  const {
    bridgeHealth,
    bridgePairing,
    refreshBridgeHealth,
    requestMockPairing,
    clearMockPairing,
    settings
  } = useSeraphim();

  return (
    <section className="view">
      <header className="view-header">
        <div>
          <h1>Local Bridge</h1>
          <p>Phase 3 health endpoint. Execution disabled until approval gates are verified.</p>
        </div>
        <button type="button" onClick={() => void refreshBridgeHealth()}>
          Check Health
        </button>
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
          <h3>Operator Pairing (mock)</h3>
          <div className="detail-row">
            <span>Status</span>
            <strong>{bridgePairing.status}</strong>
          </div>
          {bridgePairing.tokenPreview && (
            <div className="detail-row">
              <span>Token preview</span>
              <strong>{bridgePairing.tokenPreview}</strong>
            </div>
          )}
          {bridgePairing.pairedAt && (
            <div className="detail-row">
              <span>Paired at</span>
              <strong>{bridgePairing.pairedAt}</strong>
            </div>
          )}
          <div className="button-row">
            <button type="button" onClick={requestMockPairing}>
              Request Mock Pairing
            </button>
            <button type="button" className="secondary-button" onClick={clearMockPairing}>
              Clear Pairing
            </button>
          </div>
          <p className="muted">
            Phase 3 placeholder only. Real pairing tokens will require bridge verification and audit.
          </p>
        </div>

        <h3>Planned Capabilities</h3>
        <ul>
          {(bridgeHealth.capabilities.length > 0
            ? bridgeHealth.capabilities
            : [
                "workspace_read_planned",
                "file_diff_planned",
                "powershell_sentinel_planned",
                "terminal_approval_planned"
              ]
          ).map((capability) => (
            <li key={capability}>{capability}</li>
          ))}
        </ul>

        <p className="warning-box">
          Real local execution is disabled in this MVP. Health check only performs GET /health.
          Port map: Argus Vigil 8765, local-agent 8767 (legacy Red), bridge 8768.
        </p>
      </div>
    </section>
  );
}
