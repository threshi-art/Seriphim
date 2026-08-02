import { useSeraphim } from "../state/SeraphimState";
import type { SafetyLevel } from "../types/agent";

export function SettingsView() {
  const { settings, updateSettings } = useSeraphim();

  return (
    <section className="view">
      <header className="view-header">
        <div>
          <h1>Settings</h1>
          <p>Local cockpit preferences. API key field is a non-secret placeholder only.</p>
        </div>
      </header>

      <div className="card form-stack">
        <label>
          Model provider
          <input
            value={settings.modelProvider}
            onChange={(event) => updateSettings({ modelProvider: event.target.value })}
          />
        </label>

        <label>
          Model name
          <input
            value={settings.modelName}
            onChange={(event) => updateSettings({ modelName: event.target.value })}
          />
        </label>

        <label>
          API key placeholder (do not store real secrets)
          <input
            value={settings.apiKeyPlaceholder}
            onChange={(event) => updateSettings({ apiKeyPlaceholder: event.target.value })}
            placeholder="NOT A SECRET STORE"
          />
        </label>

        <label>
          Default workspace path
          <input
            value={settings.defaultWorkspace}
            onChange={(event) => updateSettings({ defaultWorkspace: event.target.value })}
            placeholder="C:\\path\\to\\approved\\workspace"
          />
        </label>

        <label>
          Bridge endpoint
          <input
            value={settings.bridgeEndpoint}
            onChange={(event) => updateSettings({ bridgeEndpoint: event.target.value })}
          />
        </label>

        <label>
          Safety mode
          <select
            value={settings.safetyMode}
            onChange={(event) =>
              updateSettings({ safetyMode: event.target.value as SafetyLevel })
            }
          >
            <option value="green">green</option>
            <option value="yellow">yellow</option>
            <option value="red">red</option>
          </select>
        </label>

        <label>
          Theme
          <select
            value={settings.theme}
            onChange={(event) =>
              updateSettings({ theme: event.target.value as "dark" | "light" })
            }
          >
            <option value="dark">dark</option>
            <option value="light">light</option>
          </select>
        </label>

        <p className="warning-box">
          Real API keys must never be stored in localStorage. Use environment variables in future bridge/web integration phases.
        </p>
      </div>
    </section>
  );
}
